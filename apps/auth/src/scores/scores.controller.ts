import { Controller, Post, Get, Body, UseGuards, Req } from '@nestjs/common';
import { ScoresService } from './scores.service';
import { CreateScoreDto } from './dto/create-score.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Public } from '../auth/decorators/public.decorator';

interface AuthenticatedRequest {
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
  };
}

@Controller('scores')
export class ScoresController {
  constructor(private readonly scoresService: ScoresService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  async create(
    @Body() createScoreDto: CreateScoreDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.scoresService.create(req.user.id, createScoreDto);
  }

  @Public()
  @Get('leaderboard')
  async getLeaderboard() {
    return this.scoresService.getLeaderboard();
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getMyScores(@Req() req: AuthenticatedRequest) {
    return this.scoresService.findUserScores(req.user.id);
  }
}
