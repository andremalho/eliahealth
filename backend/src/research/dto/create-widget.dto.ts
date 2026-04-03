import { IsEnum, IsString, IsNotEmpty, IsOptional, IsInt, IsObject, Min } from 'class-validator';
import { WidgetType, DashboardMetric, WidgetWidth } from '../dashboard.enums.js';

export class CreateWidgetDto {
  @IsEnum(WidgetType) widgetType: WidgetType;
  @IsString() @IsNotEmpty() title: string;
  @IsEnum(DashboardMetric) metric: DashboardMetric;
  @IsOptional() @IsObject() filters?: Record<string, unknown>;
  @IsOptional() @IsObject() chartConfig?: Record<string, unknown>;
  @IsOptional() @IsInt() @Min(0) position?: number;
  @IsOptional() @IsEnum(WidgetWidth) width?: WidgetWidth;
}
