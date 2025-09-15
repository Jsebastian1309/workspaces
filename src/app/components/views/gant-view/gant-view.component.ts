import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { Task } from 'src/app/models/task.model';
import { GanttItem, GanttGroup, GanttBarClickEvent, GanttViewType } from '@worktile/gantt';
import { parseISO, isValid, addDays } from 'date-fns';

@Component({
  selector: 'app-gant-view',
  templateUrl: './gant-view.component.html',
  styleUrls: ['./gant-view.component.scss']
})
export class GantViewComponent implements OnChanges {
  @Input() tasks: Task[] = [];
  @Input() statuses: { key: string; label: string; color: string }[] = [];
  // Permite configurar los campos de fechas si tu backend usa nombres distintos
  @Input() dateFieldMap: { start?: string[]; end?: string[]; due?: string[] } = {
    start: ['fechaInicio', 'inicio', 'start'],
    end: ['fechaFin', 'fechaFinal', 'fechaCierre', 'fin', 'end'],
    due: ['fechaVencimiento', 'vencimiento', 'dueDate']
  };

  items: GanttItem[] = [];
  groups: GanttGroup[] = [];
  // Ngx Gantt expects timestamps in seconds
  start: number = Math.floor(addDays(new Date(), -7).getTime() / 1000);
  end: number = Math.floor(addDays(new Date(), 21).getTime() / 1000);
  private assignees = new Map<string, string>();

  // Controles de vista (Día/Semana/Mes/Trimestre/Año)
  currentViewType: GanttViewType = GanttViewType.month;
  viewTypes = [
    { label: 'Día', value: GanttViewType.day },
    { label: 'Semana', value: GanttViewType.week },
    { label: 'Mes', value: GanttViewType.month },
    { label: 'Trimestre', value: GanttViewType.quarter },
    { label: 'Año', value: GanttViewType.year }
  ];

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['tasks']) {
      this.buildData();
    }
  }

  private parseDate(d?: string | number | Date): Date | undefined {
    if (d === undefined || d === null) return undefined;
    // Date
    if (d instanceof Date) return isNaN(d.getTime()) ? undefined : d;
    // number timestamp
    if (typeof d === 'number') {
      const dt = new Date(d);
      return isNaN(dt.getTime()) ? undefined : dt;
    }
    // string ISO or close to ISO
    let s = String(d).trim();
    // try parseISO directly
    let p = parseISO(s);
    if (isValid(p)) return p;
    // common "YYYY-MM-DD HH:mm:ss" -> replace space with T
    if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}/.test(s)) {
      p = parseISO(s.replace(' ', 'T'));
      if (isValid(p)) return p;
    }
    // fall back to Date constructor
    const dt = new Date(s);
    return isNaN(dt.getTime()) ? undefined : dt;
  }

  private pickFirstDate(task: any, candidates: string[] = []): Date | undefined {
    for (const key of candidates) {
      if (task && task[key]) {
        const dt = this.parseDate(task[key]);
        if (dt) return dt;
      }
    }
    return undefined;
  }

  private buildData() {
    const items: GanttItem[] = [];
    const groups: GanttGroup[] = [];
    const groupMap = new Map<string, GanttGroup>();
  let minStart: number | undefined;
  let maxEnd: number | undefined;
    this.assignees.clear();

    const startKeys = this.dateFieldMap.start ?? [];
    const endKeys = this.dateFieldMap.end ?? [];
    const dueKeys = this.dateFieldMap.due ?? [];

    (this.tasks || []).forEach((t) => {
      let start = this.pickFirstDate(t, startKeys) || this.pickFirstDate(t, dueKeys);
      let end = this.pickFirstDate(t, endKeys) || this.pickFirstDate(t, dueKeys);
      // Incluir tareas sin fechas: default hoy..hoy+1
      if (!start && !end) {
        const today = new Date();
        start = today;
        end = addDays(today, 1);
      }

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

      // Agrupar por lista
      const groupKey = (t.listaIdentificador || 'sin-lista') as string;
      const groupTitle = (t as any).listaNombre || `Lista ${groupKey === 'sin-lista' ? '' : groupKey}` || 'Sin Lista';
      if (!groupMap.has(groupKey)) {
        const g: GanttGroup = { id: groupKey, title: groupTitle };
        groupMap.set(groupKey, g);
        groups.push(g);
      }

      const item: GanttItem = {
        id: t.identificador,
        title: t.nombre,
        start: Math.floor(((start || end!)!).getTime() / 1000),
        end: Math.floor(((end || start!)!).getTime() / 1000),
        group_id: groupKey,
        // Mantener color por estado
        color: this.colorFromStatus(t.estado)
      };
      items.push(item);

      // keep a quick lookup for assignee by item id for table rendering
      const assignee = (typeof t.asignadoA === 'string' ? t.asignadoA : (t.asignadoA as any)?.nombre) || '';
      if (assignee) this.assignees.set(t.identificador, assignee);

      const sTs = item.start as number; // seconds
      const eTs = item.end as number;   // seconds
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
      const minDate = new Date(minStart * 1000);
      const maxDate = new Date(maxEnd * 1000);
      this.start = Math.floor(addDays(minDate, -3).getTime() / 1000);
      this.end = Math.floor(addDays(maxDate, 3).getTime() / 1000);
    } else {
      // Fallback a un rango relativo a hoy para evitar undefined en bindings
      const today = new Date();
      this.start = Math.floor(addDays(today, -7).getTime() / 1000);
      this.end = Math.floor(addDays(today, 21).getTime() / 1000);
    }
  }

  private colorFromStatus(statusKey?: string): string {
    const s = (this.statuses || []).find(x => (x.key || '').toLowerCase() === String(statusKey || '').toLowerCase());
    return s?.color || '#607d8b';
  }

  onBarClick(e: GanttBarClickEvent) {
    // placeholder: podríamos abrir detalle de tarea
    // console.log('bar click', e);
  }

  changeView(viewType: GanttViewType) {
    this.currentViewType = viewType;
  }

  private findStatusLabel(key: string): string | undefined {
    const s = (this.statuses || []).find(x => (x.key || '').toLowerCase() === String(key || '').toLowerCase());
    return s?.label;
  }

  getStatusColor(key: string): string {
    return this.colorFromStatus(key);
  }

  getStatusLabel(key: string): string {
    return this.findStatusLabel(key) || key;
  }

  getAssignee(itemId: string): string {
    return this.assignees.get(itemId) || '';
  }

  // Normaliza timestamps a milisegundos para pipes/formatos (si vienen en segundos los multiplica)
  toMs(ts: number | Date | string | undefined | null): number | null {
    if (ts === undefined || ts === null) return null;
    if (ts instanceof Date) return ts.getTime();
    const n = typeof ts === 'number' ? ts : Number(ts);
    if (!isFinite(n)) return null;
    return n < 1e12 ? n * 1000 : n; // si es menor a ~Sat Nov 20 2001 en ms, asumimos segundos
  }
}
