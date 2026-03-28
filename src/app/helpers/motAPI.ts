import {
  InternalServerErrorException,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import config from '../config';

export interface MotRfrComment {
  text: string;
  type: string;
  dangerous?: boolean;
}

export interface MotTestRecord {
  completedDate: string;
  testResult: string;
  expiryDate?: string;
  odometerValue?: string;
  odometerUnit?: string;
  odometerResultType?: string;
  rfrAndComments?: MotRfrComment[];
}

export interface MotVehicleResponse {
  registration: string;
  make: string;
  model: string;
  firstUsedDate?: string;
  fuelType?: string;
  primaryColour?: string;
  dvlaId?: string;
  dvlaMake?: string;
  engineSize?: string;
  motTests?: MotTestRecord[];
}

// ─── Token cache (module-level, process চলা পর্যন্ত থাকবে) ──────────
let cachedToken: string | null = null;
let tokenExpiry = 0;

async function getMotAccessToken(): Promise<string> {
  const now = Date.now();
  if (cachedToken && now < tokenExpiry) return cachedToken;

  const { clientId, clientSecret, scopeUrl, tokenUrl } = config.mot;
  if (!clientId || !clientSecret || !tokenUrl)
    throw new InternalServerErrorException(
      'MOT API credentials missing in .env',
    );

  const params = new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: clientId,
    client_secret: clientSecret,
    scope: scopeUrl,
  });

  let res: Response;
  try {
    res = await fetch(tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    });
  } catch {
    throw new ServiceUnavailableException(
      'Cannot connect to MOT token endpoint',
    );
  }

  if (!res.ok)
    throw new InternalServerErrorException(
      `MOT token fetch failed with status ${res.status}`,
    );

  const json = await res.json();
  cachedToken = json.access_token as string;
  // expires_in সাধারণত 3600s, ৬০s আগেই refresh করব
  tokenExpiry = now + (json.expires_in - 60) * 1000;

  return cachedToken;
}

// ─── MOT History fetch ────────────────────────────────────────────────
export async function getMOTHistory(
  registrationNumber: string,
): Promise<MotVehicleResponse> {
  const token = await getMotAccessToken();
  const vrn = registrationNumber.replace(/\s/g, '').toUpperCase();

  let res: Response;
  try {
    res = await fetch(`${config.mot.apiBase}/registration/${vrn}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'X-API-Key': config.mot.apiKey ?? '',
      },
    });
  } catch {
    throw new ServiceUnavailableException('Cannot connect to MOT History API');
  }

  if (res.status === 404)
    throw new NotFoundException(`No MOT history found for ${vrn}`);

  if (!res.ok)
    throw new InternalServerErrorException(`MOT API error: ${res.status}`);

  return res.json() as Promise<MotVehicleResponse>;
}
