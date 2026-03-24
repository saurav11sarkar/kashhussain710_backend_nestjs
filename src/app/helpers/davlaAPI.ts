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
}

const DVLA_URL = config.devla.baseUrl;

const getDvlaApiKey = () => {
  if (config.devla.defaultKeyType === 'paid' && config.devla.paidDevialKey) {
    return config.devla.paidDevialKey;
  }

  return config.devla.freeDevialKey || config.devla.paidDevialKey;
};

export const freeDvlaApi = async (
  carNumber: string,
): Promise<VehicleResponse> => {
  const apiKey = getDvlaApiKey();

  if (!apiKey) {
    throw new InternalServerErrorException(
      'DVLA API key is missing from environment configuration',
    );
  }

  const vrn = carNumber.replace(/\s/g, '').toUpperCase();

  let response: Response;

  try {
    response = await fetch(DVLA_URL, {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ registrationNumber: vrn }),
    });
  } catch {
    throw new ServiceUnavailableException(
      'Unable to connect to DVLA service right now',
    );
  }

  if (!response.ok) {
    let errorMessage = `DVLA request failed with status ${response.status}`;

    try {
      const err = await response.json();
      errorMessage = err?.errors?.[0]?.detail ?? errorMessage;
    } catch {
      const errText = await response.text();
      if (errText) {
        errorMessage = errText;
      }
    }

    if (response.status === 400) {
      throw new BadRequestException(errorMessage);
    }

    if (response.status === 404) {
      throw new NotFoundException(errorMessage);
    }

    if (response.status === 401 || response.status === 403) {
      throw new BadGatewayException('DVLA API authentication failed');
    }

    throw new BadGatewayException(errorMessage);
  }

  return response.json() as Promise<VehicleResponse>;
};
