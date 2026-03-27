import {
  InternalServerErrorException,
  ServiceUnavailableException,
  NotFoundException,
  HttpException,
} from '@nestjs/common';
import config from '../config';

export interface MotTestRecord {
  completedDate: string;
  testResult: string;
  expiryDate?: string;
  odometerValue?: string;
  odometerUnit?: string;
  odometerResultType?: string;
  rfrAndComments?: {
    text: string;
    type: string;
    dangerous?: boolean;
  }[];
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

// Token cache
let cachedToken: string | null = null;
let tokenExpiry = 0;

async function getMotAccessToken(): Promise<string> {
  const now = Date.now();
  if (cachedToken && now < tokenExpiry) return cachedToken;

  const { clientId, clientSecret, scopeUrl, tokenUrl } = config.mot;

  if (!clientId || !clientSecret || !scopeUrl || !tokenUrl)
    throw new InternalServerErrorException('MOT API credentials missing');

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
      `MOT token fetch failed: ${res.status}`,
    );

  const json = await res.json();
  cachedToken = json.access_token as string;
  tokenExpiry = now + (json.expires_in - 60) * 1000;

  return cachedToken;
}

export async function getMotHistory(
  registrationNumber: string,
): Promise<MotVehicleResponse> {
  const token = await getMotAccessToken();
  const vrn = registrationNumber.replace(/\s/g, '').toUpperCase();
  if (!token) throw new HttpException('token is not fount', 404);

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
