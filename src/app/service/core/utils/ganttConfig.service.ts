import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { GanttGlobalConfig } from '@worktile/gantt';

@Injectable({
  providedIn: 'root'
})
export class GanttConfigService {
  constructor(private translate: TranslateService) {}
  public getGanttConfig(): GanttGlobalConfig {
    const weekText = this.translate.instant('gantt.week');
    const ofText = this.translate.instant('gantt.of');
    const weekTextCap = weekText.charAt(0).toUpperCase() + weekText.slice(1);

    return {
      dateFormat: {
        yearQuarter: `QQQ '${ofText}' yyyy`, 
        month: 'LLLL',
        yearMonth: 'LLLL yyyy',
        week: `'${weekTextCap}' w '${ofText}' MMM yyyy`,
        year: 'yyyy'
      }
    };
  }
}

export function ganttConfigFactory(ganttConfigService: GanttConfigService): GanttGlobalConfig {
  return ganttConfigService.getGanttConfig();
}