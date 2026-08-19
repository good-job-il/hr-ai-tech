import { Body, Controller, Get, Post, Req } from "@nestjs/common"
import { Request } from "express"
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger"
import { CurrentUser } from "../../common/decorators/current-user.decorator"
import { Public } from "../../common/decorators/public.decorator"
import { UserEntity } from "../users/user.entity"
import { GetJobRecommendationsDto, SmartSearchDto, ExtractResumeFnDto } from "./dto/functions.dto"
import { MatchingService } from "./services/matching.service"
import { ResumeExtractionService } from "./services/resume-extraction.service"
import { FunctionsMiscService } from "./services/functions-misc.service"

@ApiTags("Public and candidate workflow")
@ApiBearerAuth()
@Controller()
export class PublicWorkflowController {
  constructor(
    private readonly matching: MatchingService,
    private readonly resumeExtraction: ResumeExtractionService,
    private readonly misc: FunctionsMiscService,
  ) {}

  @Post("jobs/search")
  @Public()
  searchJobs(@Body() dto: SmartSearchDto) {
    return this.matching.smartSearch(dto)
  }

  @Post("matching/jobs/similar")
  @Public()
  similarJobs(@Body() dto: GetJobRecommendationsDto) {
    return this.matching.getJobRecommendations(dto)
  }

  @Get("matching/jobs/recommended")
  recommendedJobs(@CurrentUser() user: UserEntity) {
    return this.matching.getRecommendedJobs(user)
  }

  @Post("resumes/extract")
  extractResume(@Body() dto: ExtractResumeFnDto) {
    return this.resumeExtraction.extractAndTranslate(dto)
  }

  @Get("location/current")
  @Public()
  currentLocation(@Req() req: Request) {
    const ip =
      (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ||
      (req.headers["x-real-ip"] as string) ||
      req.ip

    return this.misc.getLocationFromIP(ip)
  }
}
