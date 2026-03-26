import {
  BadGatewayException,
  BadRequestException,
  InternalServerErrorException,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import config from '../config';

// ─── Interfaces ───────────────────────────────────────────────

export interface VehicleResponse {
  registrationNumber: string;
  taxStatus: string;
  taxDueDate: string;
  motStatus: string;
  motExpiryDate?: string;
  make: string;
  colour: string;
  fuelType: string;
  yearOfManufacture: number;
  engineCapacity: number;
  co2Emissions: number;
  monthOfFirstRegistration: string;
  markedForExport: boolean;
  dateOfLastV5CIssued: string;
  euroStatus?: string;
  wheelplan?: string;
  revenueWeight?: number;
  typeApproval?: string;
}

export interface DvsaMotDefect {
  text: string;
  type: string;
  dangerous?: boolean;
}

export interface DvsaMotTest {
  completedDate: string;
  testResult: string;
  expiryDate?: string;
  odometerValue?: string | number;
  odometerUnit?: string;
  odometerResultType?: string;
  motTestNumber?: string;
  defects?: DvsaMotDefect[];
}

export interface DvsaMotResponse {
  registration: string;
  make?: string;
  model?: string;
  firstUsedDate?: string;
  fuelType?: string;
  primaryColour?: string;
  engineSize?: string;
  hasOutstandingRecall?: string;
  motTests?: DvsaMotTest[];
}

// ─── Token Cache ──────────────────────────────────────────────

let cachedToken: string | null = null;
let tokenExpiresAt = 0;

// ─── DVLA API ─────────────────────────────────────────────────

const getDvlaApiKey = (): string => {
  if (config.dvla.defaultKeyType === 'paid' && config.dvla.paidApiKey) {
    return config.dvla.paidApiKey;
  }
  const key = config.dvla.freeApiKey || config.dvla.paidApiKey;
  if (!key) {
    throw new InternalServerErrorException(
      'DVLA API key is missing from environment configuration',
    );
  }
  return key;
};

export const freeDvlaApi = async (
  carNumber: string,
): Promise<VehicleResponse> => {
  const apiKey = getDvlaApiKey();
  const vrn = carNumber.replace(/\s/g, '').toUpperCase();

  if (!vrn || vrn.length < 2 || vrn.length > 8) {
    throw new BadRequestException('Invalid registration number format');
  }

  let response: Response;
  try {
    response = await fetch(config.dvla.baseUrl, {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ registrationNumber: vrn }),
    });
  } catch (err: any) {
    throw new ServiceUnavailableException(
      `Unable to connect to DVLA service: ${err?.message || 'Unknown error'}`,
    );
  }

  if (!response.ok) {
    let errorMessage = `DVLA request failed with status ${response.status}`;
    try {
      const err = await response.json();
      errorMessage = err?.errors?.[0]?.detail || err?.message || errorMessage;
    } catch {
      try {
        const errText = await response.text();
        if (errText) errorMessage = errText;
      } catch {
        /* keep default */
      }
    }

    switch (response.status) {
      case 400:
        throw new BadRequestException(errorMessage);
      case 404:
        throw new NotFoundException(
          `Vehicle not found for registration: ${vrn}`,
        );
      case 401:
      case 403:
        throw new BadGatewayException(
          'DVLA API authentication failed — check your API key',
        );
      case 429:
        throw new ServiceUnavailableException(
          'DVLA API rate limit exceeded — please try again later',
        );
      case 500:
      case 502:
      case 503:
        throw new ServiceUnavailableException(
          'DVLA service is currently unavailable',
        );
      default:
        throw new BadGatewayException(errorMessage);
    }
  }

  try {
    const data = (await response.json()) as VehicleResponse;
    if (!data.registrationNumber || !data.make) {
      throw new InternalServerErrorException(
        'DVLA returned incomplete vehicle data',
      );
    }
    return data;
  } catch (err: any) {
    if (
      err instanceof InternalServerErrorException ||
      err instanceof BadGatewayException
    ) {
      throw err;
    }
    throw new InternalServerErrorException('Failed to parse DVLA API response');
  }
};

// ─── DVSA OAuth2 Token ────────────────────────────────────────

const getDvsaAccessToken = async (): Promise<string | null> => {
  const { clientId, clientSecret, tokenUrl, scope } = config.dvsa;

  // credentials না থাকলে null return করো (graceful fallback)
  if (!clientId || !clientSecret || !tokenUrl) {
    return null;
  }

  // Cache valid থাকলে return করো
  if (cachedToken && Date.now() < tokenExpiresAt) {
    return cachedToken;
  }

  let response: Response;
  try {
    response = await fetch(tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: clientId,
        client_secret: clientSecret,
        scope: scope,
      }),
    });
  } catch (err: any) {
    throw new ServiceUnavailableException(
      `Unable to connect to DVSA auth service: ${err?.message || 'Unknown error'}`,
    );
  }

  if (!response.ok) {
    throw new BadGatewayException(
      `DVSA auth failed with status ${response.status}`,
    );
  }

  const payload = (await response.json()) as {
    access_token?: string;
    expires_in?: number;
  };

  if (!payload.access_token) {
    throw new BadGatewayException('DVSA auth did not return an access token');
  }

  // Cache — expires_in 60 sec আগে refresh
  cachedToken = payload.access_token;
  tokenExpiresAt = Date.now() + ((payload.expires_in ?? 3600) - 60) * 1000;

  return cachedToken;
};

// ─── DVSA MOT History API ─────────────────────────────────────

export const getDvsaMotHistory = async (
  registrationNumber: string,
): Promise<DvsaMotResponse | null> => {
  const registration = registrationNumber.replace(/\s+/g, '').toUpperCase();

  if (!registration) {
    throw new BadRequestException('Registration number is required');
  }

  const { motApiKey, motApiUrl } = config.dvsa;

  if (!motApiKey || !motApiUrl) {
    // DVSA not configured — gracefully return null
    return null;
  }

  // Token নাও (থাকলে, না থাকলে null)
  const accessToken = await getDvsaAccessToken();

  // Headers তৈরি করো
  const headers: Record<string, string> = {
    Accept: 'application/json+v6',
    'X-API-Key': motApiKey,
  };

  // OAuth token থাকলে যোগ করো
  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }

  let response: Response;
  try {
    response = await fetch(`${motApiUrl}${registration}`, {
      method: 'GET',
      headers,
    });
  } catch (err: any) {
    throw new ServiceUnavailableException(
      `Unable to connect to DVSA MOT service: ${err?.message || 'Unknown error'}`,
    );
  }

  // 404 = vehicle not found (valid case)
  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    let errorBody = '';
    try {
      errorBody = await response.text();
    } catch {
      /* ignore */
    }

    console.error(`DVSA MOT ${response.status}:`, errorBody);

    switch (response.status) {
      case 401:
        throw new BadGatewayException(
          'DVSA authentication failed — check credentials',
        );
      case 403:
        // 403 = credentials আছে কিন্তু access নেই অথবা token নেই
        // Graceful fallback — null return করো
        return null;
      case 429:
        throw new ServiceUnavailableException('DVSA rate limit exceeded');
      default:
        throw new BadGatewayException(
          `DVSA MOT request failed with status ${response.status}`,
        );
    }
  }

  const data = (await response.json()) as DvsaMotResponse | DvsaMotResponse[];

  if (Array.isArray(data)) {
    return data[0] ?? null;
  }

  return data;
};

// ─── Helper Functions ─────────────────────────────────────────

export const extractMileageInfo = (motData: DvsaMotResponse | null) => {
  const sortedTests = [...(motData?.motTests || [])].sort(
    (a, b) =>
      new Date(a.completedDate).getTime() - new Date(b.completedDate).getTime(),
  );

  const odometerReadings = sortedTests
    .map((test) => Number(test.odometerValue))
    .filter((value) => Number.isFinite(value) && value > 0);

  const lastMotMileage =
    odometerReadings.length > 0
      ? odometerReadings[odometerReadings.length - 1]
      : 0;

  let mileageIssues = 'No issues detected';
  for (let i = 1; i < odometerReadings.length; i++) {
    if (odometerReadings[i] < odometerReadings[i - 1]) {
      mileageIssues = 'Potential mileage inconsistency detected';
      break;
    }
  }

  let average = 0;
  if (sortedTests.length > 1 && odometerReadings.length > 1) {
    const firstDate = new Date(sortedTests[0].completedDate).getTime();
    const lastDate = new Date(
      sortedTests[sortedTests.length - 1].completedDate,
    ).getTime();
    const years = Math.max(
      (lastDate - firstDate) / (1000 * 60 * 60 * 24 * 365),
      1,
    );
    average = Math.round((lastMotMileage - odometerReadings[0]) / years);
  }

  let status = 'UNKNOWN';
  if (average > 0 && average < 8000) status = 'LOW';
  else if (average >= 8000 && average < 15000) status = 'AVERAGE';
  else if (average >= 15000) status = 'HIGH';

  return { lastMotMileage, mileageIssues, average, status };
};

export const extractMotSummary = (motData: DvsaMotResponse | null) => {
  const motTests = motData?.motTests || [];
  const passed = motTests.filter(
    (t) => t.testResult?.toUpperCase() === 'PASSED',
  ).length;
  const failed = motTests.filter(
    (t) => t.testResult?.toUpperCase() === 'FAILED',
  ).length;
  return { totalTests: motTests.length, passed, failed };
};
