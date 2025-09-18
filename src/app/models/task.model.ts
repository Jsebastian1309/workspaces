export interface Task {
  identificador: string;
  nombre: string;
  descripcion?: string;
  estado?: string; // normalized key e.g., OPEN, PENDING, BLOCKED, DONE
  estadoLabel?: string; // original label from backend (e.g., Completada, Pendiente)
  fechaVencimiento?: string | Date; // Due date
  prioridad?: string; // e.g., Low, Medium, High
  asignadoA?: string | { nombre?: string; username?: string; id?: string };
  listaIdentificador?: string;
  espacioTrabajoIdentificador?: string;
  fechaInicio?: string | Date;
  fechaFin?: string | Date;
  duracionHoras?: number;
  tipoTarea?: string;
  etiqueta?: string;
  comentarios?: string;
  progreso?: number;
  // Extended fields for detailed modal editing
  fechaCreacionTarea?: string | Date;
  fechaCerrada?: string | Date;
  fechaTerminada?: string | Date;
  facturable?: boolean;
  responsableIdentificador?: string;
  // Extend with backend fields as needed
}
