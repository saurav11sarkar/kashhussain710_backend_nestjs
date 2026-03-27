import {
  BadGatewayException,
  BadRequestException,
  InternalServerErrorException,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import config from '../config';

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
}

// ─── Internal helper ────────────────────────────────────────────────
// async function callDvla(
//   registrationNumber: string,
//   apiKey: string,
// ): Promise<VehicleResponse> {
//   const vrn = registrationNumber.replace(/\s/g, '').toUpperCase();

//   let response: Response;
//   try {
//     response = await fetch(config.devla.baseUrl, {
//       method: 'POST',
//       headers: {
//         'x-api-key': apiKey,
//         'Content-Type': 'application/json',
//       },
//       body: JSON.stringify({ registrationNumber: vrn }),
//     });
//   } catch {
//     throw new ServiceUnavailableException(
//       'Unable to connect to DVLA service right now',
//     );
//   }

//   if (!response.ok) {
//     let errorMessage = `DVLA request failed with status ${response.status}`;
//     try {
//       const err = await response.json();
//       errorMessage = err?.errors?.[0]?.detail ?? errorMessage;
//     } catch {
//       const errText = await response.text();
//       if (errText) errorMessage = errText;
//     }

//     if (response.status === 400) throw new BadRequestException(errorMessage);
//     if (response.status === 404) throw new NotFoundException(errorMessage);
//     if (response.status === 401 || response.status === 403)
//       throw new BadGatewayException('DVLA API authentication failed');

//     throw new BadGatewayException(errorMessage);
//   }

//   return response.json() as Promise<VehicleResponse>;
// }

async function callDvla(
  registrationNumber: string,
  apiKey: string,
): Promise<VehicleResponse> {
  const vrn = registrationNumber.replace(/\s/g, '').toUpperCase();

  if (!vrn || vrn.length < 5) {
    throw new BadRequestException('Invalid registration number');
  }

  let response: Response;

  try {
    response = await fetch(config.devla.baseUrl, {
      method: 'POST',
      headers: {
        'x-api-key': apiKey.trim(), // 🔥 trim added
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({ registrationNumber: vrn }),
    });
  } catch (error) {
    console.log(error);
    throw new ServiceUnavailableException(
      'Unable to connect to DVLA service right now',
    );
  }

  // 🔥 DEBUG LOG (temporary)
  console.log('DVLA STATUS:', response.status);

  if (!response.ok) {
    let errorMessage = `DVLA request failed with status ${response.status}`;

    try {
      const err = await response.json();
      console.log('DVLA ERROR BODY:', err); // 🔥 important debug
      errorMessage = err?.errors?.[0]?.detail ?? errorMessage;
    } catch {
      const errText = await response.text();
      console.log('DVLA ERROR TEXT:', errText); // 🔥 debug
      if (errText) errorMessage = errText;
    }

    if (response.status === 400) throw new BadRequestException(errorMessage);

    if (response.status === 404)
      throw new NotFoundException('Vehicle not found');

    if (response.status === 401 || response.status === 403)
      throw new BadGatewayException(
        'DVLA API authentication failed (check API key or IP)',
      );

    throw new BadGatewayException(errorMessage);
  }

  return response.json() as Promise<VehicleResponse>;
}

// ─── Free key ───────────────────────────────────────────────────────
export async function freeDvlaCarCheck(
  registrationNumber: string,
): Promise<VehicleResponse> {
  const apiKey = config.devla.freeDevialKey;
  if (!apiKey)
    throw new InternalServerErrorException('FREE DVLA API key missing');
  return callDvla(registrationNumber, apiKey);
}

// ─── Paid key ───────────────────────────────────────────────────────
export async function paidDvlaCarCheck(
  registrationNumber: string,
): Promise<VehicleResponse> {
  const apiKey = config.devla.paidDevialKey;
  if (!apiKey)
    throw new InternalServerErrorException('PAID DVLA API key missing');
  return callDvla(registrationNumber, apiKey);
}

// ─── Auto (paid → free fallback) ────────────────────────────────────
export async function freeDvlaApi(
  registrationNumber: string,
): Promise<VehicleResponse> {
  return freeDvlaCarCheck(registrationNumber);
}
