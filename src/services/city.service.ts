import { CityRepository } from '../repositories/city.repository.js';
import { CountryRepository } from '../repositories/country.repository.js';
import { City, Country, CityStatistics } from '../types/models.js';
import { NotFoundError } from '../errors/AppError.js';

export class CityService {
  constructor(
    private readonly cityRepo: CityRepository,
    private readonly countryRepo: CountryRepository
  ) {}

  async getAllCities(): Promise<City[]> {
    return this.cityRepo.findAll();
  }

  async getCity(cityName: string, countryName: string): Promise<City> {
    const city = await this.cityRepo.findByNameAndCountry(cityName, countryName);
    if (!city) {
      throw new NotFoundError(`City "${cityName}, ${countryName}" not found`);
    }
    return city;
  }

  async getAllCountries(): Promise<Country[]> {
    return this.countryRepo.findAll();
  }

  async getCountry(name: string): Promise<Country> {
    const country = await this.countryRepo.findByName(name);
    if (!country) {
      throw new NotFoundError(`Country "${name}" not found`);
    }
    return country;
  }

  async getCityStatistics(city: string, country: string): Promise<CityStatistics | null> {
    return this.cityRepo.findCityStatistics(city, country);
  }
}
