import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class UniqueIdService {

  constructor() { }

public generateId(nombre: string): string {
    const nombreLimpio = nombre.toLowerCase()
      .replace(/[^a-z0-9]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '');
    const base = nombreLimpio.slice(0, 8);
    const sufijo = Date.now().toString().slice(-6);
    return (base + '_' + sufijo).slice(0, 15);
  }

}
