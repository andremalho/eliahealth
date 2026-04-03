import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ResearchDashboard } from './research-dashboard.entity.js';
import { DashboardWidget } from './dashboard-widget.entity.js';
import { DashboardStatsService } from './dashboard-stats.service.js';
import { CreateDashboardDto } from './dto/create-dashboard.dto.js';
import { CreateWidgetDto } from './dto/create-widget.dto.js';
import { UpdateWidgetDto } from './dto/update-widget.dto.js';

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(ResearchDashboard) private readonly dashRepo: Repository<ResearchDashboard>,
    @InjectRepository(DashboardWidget) private readonly widgetRepo: Repository<DashboardWidget>,
    private readonly statsService: DashboardStatsService,
  ) {}

  async createDashboard(userId: string, dto: CreateDashboardDto): Promise<ResearchDashboard> {
    const dashboard = this.dashRepo.create({ ...dto, userId });
    return this.dashRepo.save(dashboard);
  }

  async findDashboards(userId: string): Promise<ResearchDashboard[]> {
    return this.dashRepo.find({ where: { userId }, order: { isDefault: 'DESC', createdAt: 'ASC' } });
  }

  async findDashboardWithData(id: string) {
    const dashboard = await this.dashRepo.findOne({
      where: { id },
      relations: ['widgets'],
    });
    if (!dashboard) throw new NotFoundException(`Dashboard ${id} nao encontrado`);

    const widgetsWithData = await Promise.all(
      (dashboard.widgets ?? [])
        .sort((a, b) => a.position - b.position)
        .map(async (w) => ({
          ...w,
          data: await this.statsService.getMetricData(w.metric, w.filters ?? undefined),
        })),
    );

    return { ...dashboard, widgets: widgetsWithData };
  }

  async addWidget(dashboardId: string, dto: CreateWidgetDto): Promise<DashboardWidget> {
    const dashboard = await this.dashRepo.findOneBy({ id: dashboardId });
    if (!dashboard) throw new NotFoundException(`Dashboard ${dashboardId} nao encontrado`);
    const widget = this.widgetRepo.create({ ...dto, dashboardId });
    return this.widgetRepo.save(widget);
  }

  async updateWidget(id: string, dto: UpdateWidgetDto): Promise<DashboardWidget> {
    const widget = await this.widgetRepo.findOneBy({ id });
    if (!widget) throw new NotFoundException(`Widget ${id} nao encontrado`);
    Object.assign(widget, dto);
    return this.widgetRepo.save(widget);
  }

  async removeWidget(id: string): Promise<void> {
    const widget = await this.widgetRepo.findOneBy({ id });
    if (!widget) throw new NotFoundException(`Widget ${id} nao encontrado`);
    await this.widgetRepo.remove(widget);
  }

  async getWidgetData(id: string) {
    const widget = await this.widgetRepo.findOneBy({ id });
    if (!widget) throw new NotFoundException(`Widget ${id} nao encontrado`);
    return this.statsService.getMetricData(widget.metric, widget.filters ?? undefined);
  }
}
