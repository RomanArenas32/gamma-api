import { Injectable, NotFoundException } from '@nestjs/common';
import { CitiesRepository } from '../repositories/cities.repository';
import { CreateCityDto } from '../dto/create-city.dto';

@Injectable()
export class CitiesService {
  constructor(private readonly citiesRepository: CitiesRepository) {}

  async create(createCityDto: CreateCityDto) {
    const city = this.citiesRepository.create(createCityDto);
    return await this.citiesRepository.save(city);
  }

  async findAll() {
    return await this.citiesRepository.find({
      order: { name: 'ASC' },
    });
  }

  async findOne(id: string) {
    const city = await this.citiesRepository.findOne({ where: { id } });
    if (!city) {
      throw new NotFoundException(`City with ID ${id} not found`);
    }
    return city;
  }

  async findByIds(ids: string[]) {
    return await this.citiesRepository.findByIds(ids);
  }

  async remove(id: string) {
    const city = await this.findOne(id);
    await this.citiesRepository.remove(city);
  }
}
