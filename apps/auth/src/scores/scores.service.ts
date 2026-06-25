import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateScoreDto } from './dto/create-score.dto';

@Injectable()
export class ScoresService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, createScoreDto: CreateScoreDto) {
    const existingScore = await this.prisma.score.findFirst({
      where: { userId },
    });

    if (existingScore) {
      if (createScoreDto.score > existingScore.score) {
        return this.prisma.score.update({
          where: { id: existingScore.id },
          data: {
            score: createScoreDto.score,
            wave: createScoreDto.wave,
          },
        });
      }
      return existingScore;
    }

    return this.prisma.score.create({
      data: {
        score: createScoreDto.score,
        wave: createScoreDto.wave,
        userId,
      },
    });
  }

  async getLeaderboard() {
    return this.prisma.score.findMany({
      take: 10,
      orderBy: {
        score: 'desc',
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });
  }

  async findUserScores(userId: string) {
    return this.prisma.score.findMany({
      where: { userId },
      orderBy: {
        score: 'desc',
      },
      take: 5,
    });
  }
}
