import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { Task } from 'src/app/models/task.model';
import { GanttItem, GanttGroup, GanttBarClickEvent } from '@worktile/gantt';
import { parseISO, isValid, addDays } from 'date-fns';

@Component({
  selector: 'app-gant-view',
  templateUrl: './gant-view.component.html',
  styleUrls: ['./gant-view.component.scss']
})
export class GantViewComponent implements OnChanges {
  @Input() tasks: Task[] = [];

  items: GanttItem[] = [];
  groups: GanttGroup[] = [];
  start: number = addDays(new Date(), -7).getTime();
  end: number = addDays(new Date(), 21).getTime();

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
  let minStart: number | undefined;
  let maxEnd: number | undefined;

    (this.tasks || []).forEach((t) => {
      let start = this.parseDate((t as any).fechaInicio ?? (t as any).fechaVencimiento);
      let end = this.parseDate((t as any).fechaFin ?? (t as any).fechaVencimiento ?? (t as any).fechaFinal ?? (t as any).fechaCierre);
      if (!start && !end) return;

      // Normalizar: si solo hay una fecha, crea una duración mínima de 1 día; si end < start, intercambiar
      if (start && !end) {
        end = addDays(start, 1);
      } else if (!start && end) {
        start = addDays(end, -1);
      } else if (start && end && end < start) {
        const tmp = start; start = end; end = tmp;
      } else if (start && end && end.getTime() === start.getTime()) {
        end = addDays(end, 1);
      }

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

  const sTs = item.start as number;
  const eTs = item.end as number;
      if (minStart === undefined || sTs < minStart) {
        minStart = sTs;
      }
      if (maxEnd === undefined || eTs > maxEnd) {
        maxEnd = eTs;
      }
    });

    this.items = items;
    this.groups = groups;
    if (minStart !== undefined && maxEnd !== undefined) {
      // Extender el rango un poco para que no quede al ras
      this.start = addDays(new Date(minStart), -3).getTime();
      this.end = addDays(new Date(maxEnd), 3).getTime();
    } else {
      // Fallback a un rango relativo a hoy para evitar undefined en bindings
      const today = new Date();
      this.start = addDays(today, -7).getTime();
      this.end = addDays(today, 21).getTime();
    }
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
