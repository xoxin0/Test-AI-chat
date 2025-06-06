import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})

export class LocalStorageService {
  public saveData(key: string, data: string): void {
    localStorage.setItem(key, data);
  }

  public getData(key: string): string | null {
    return localStorage.getItem(key);
  }

  public removeData(key: string): void {
    localStorage.removeItem(key);
  }

  public clearAll(): void {
    localStorage.clear();
  }
}
