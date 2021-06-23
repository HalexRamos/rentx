import dayjs from 'dayjs';

import { RentalsRepositoryInMemory } from '@modules/rentals/infra/typeorm/repositories/in-memory/RentalsRepositoryInMemory';
import { AppError } from '@shared/errors/AppError';
import { DayJsDateProvider } from '@shared/container/providers/DateProvider/implementations/DayJsDateProvider';
import { CarsRepositoryInMemory } from '@modules/cars/repositories/in-memory/CarsRepositoryInMemory';
import { CreateRentalUseCase } from './CreateRentalUseCase';

let createRentalUseCase: CreateRentalUseCase;
let rentalsRepositoryInMemory: RentalsRepositoryInMemory;
let carsRepositoryInMemory: CarsRepositoryInMemory;
let dayjsProvider: DayJsDateProvider;

describe('Create Rental', () => {
  const dayAdd24Hours = dayjs().add(1, 'day').toDate();
  beforeEach(() => {
    rentalsRepositoryInMemory = new RentalsRepositoryInMemory();
    carsRepositoryInMemory = new CarsRepositoryInMemory();
    dayjsProvider = new DayJsDateProvider();
    createRentalUseCase = new CreateRentalUseCase(
      rentalsRepositoryInMemory,
      dayjsProvider,
      carsRepositoryInMemory,
    );
  });

  it(' should be able to create a new rental', async () => {
    const car = await carsRepositoryInMemory.create({
      name: 'Test',
      description: 'Car Test',
      daily_rate: 100,
      license_plate: 'test',
      fine_amount: 40,
      category_id: '1234',
      brand: 'brand',
    });

    const rental = await createRentalUseCase.execute({
      user_id: '12345',
      car_id: car.id,
      expected_return_date: dayAdd24Hours,
    });

    expect(rental).toHaveProperty('id');
    expect(rental).toHaveProperty('start_date');
  });

  it(' should not be able to create a new rental if there is a another open to the same user', async () => {
    await rentalsRepositoryInMemory.create({
      car_id: '1111',
      expected_return_date: dayAdd24Hours,
      user_id: '12345',
    });

    await expect(
      createRentalUseCase.execute({
        user_id: '12345',
        car_id: '121212',
        expected_return_date: dayAdd24Hours,
      }),
    ).rejects.toEqual(new AppError("There's a rental in progress for user!"));
  });

  it(' should not be able to create a new rental if there is a another open to the same car', async () => {
    await rentalsRepositoryInMemory.create({
      car_id: 'test',
      expected_return_date: dayAdd24Hours,
      user_id: '12345',
    });

    expect(
      createRentalUseCase.execute({
        user_id: '321',
        car_id: 'test',
        expected_return_date: dayAdd24Hours,
      }),
    ).rejects.toEqual(new AppError('Car is unavailable'));
  });

  it(' should not be able to create a new rental with invalid return time', async () => {
    await expect(
      createRentalUseCase.execute({
        user_id: '321',
        car_id: 'test',
        expected_return_date: dayjs().toDate(),
      }),
    ).rejects.toEqual(new AppError('Invalid return time!'));
  });
});
