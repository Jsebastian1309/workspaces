import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { Task } from 'src/app/models/task.model';
import { GanttItem, GanttGroup, GanttBarClickEvent } from '@worktile/gantt';
import { parseISO, isValid } from 'date-fns';

@Component({
  selector: 'app-gant-view',
  templateUrl: './gant-view.component.html',
  styleUrls: ['./gant-view.component.scss']
})
export class GantViewComponent implements OnChanges {
  @Input() tasks: Task[] = [];

  items: GanttItem[] = [];
  groups: GanttGroup[] = [];

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['tasks']) {
      this.buildData();
    }
  }

  private parseDate(d?: string | Date): Date | undefined {
    if (!d) return undefined;
    if (d instanceof Date) return isNaN(d.getTime()) ? undefined : d;
    const p = parseISO(d);
    return isValid(p) ? p : undefined;
  }

  private buildData() {
    const items: GanttItem[] = [];
    const groups: GanttGroup[] = [];
    const groupMap = new Map<string, GanttGroup>();

    (this.tasks || []).forEach((t) => {
      const start = this.parseDate((t as any).fechaInicio ?? (t as any).fechaVencimiento);
      const end = this.parseDate((t as any).fechaFin ?? (t as any).fechaVencimiento ?? (t as any).fechaFinal ?? (t as any).fechaCierre);
      if (!start && !end) return;

      const groupKey = t.estado || 'OPEN';
      if (!groupMap.has(groupKey)) {
        const g: GanttGroup = { id: groupKey, title: groupKey };
        groupMap.set(groupKey, g);
        groups.push(g);
      }

      const item: GanttItem = {
        id: t.identificador,
        title: t.nombre,
        start: (start || end!)!.getTime(),
        end: (end || start!)!.getTime(),
        group_id: groupKey,
        color: this.colorByPriority(t.prioridad)
      };
      items.push(item);
    });

    this.items = items;
    this.groups = groups;
  }

  colorByPriority(priority?: string): string | undefined {
    const map: Record<string, string> = {
      High: '#e53935',
      Medium: '#fb8c00',
      Low: '#1e88e5'
    };
    return map[priority || ''] || '#607d8b';
  }

  onBarClick(e: GanttBarClickEvent) {
    // placeholder: podríamos abrir detalle de tarea
    // console.log('bar click', e);
  }
}
