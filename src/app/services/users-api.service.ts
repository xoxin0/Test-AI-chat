import {
  inject,
  Injectable
} from '@angular/core';

import { Observable } from 'rxjs';
import { User } from '../interfaces/user';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})

export class UsersApiService {
  private readonly API_URL: string = 'http://localhost:3000/users';
  private readonly http: HttpClient = inject(HttpClient);

  public getUsers(): Observable<User[]> {
    return this.http.get<User[]>(this.API_URL);
  }

  public registerUser(user: User): Observable<User> {
    return this.http.post<User>(this.API_URL, user);
  }

  public updateUser(user: User): Observable<User> {
    return this.http.put<User>(`${this.API_URL}/${user.id}`, user);
  }
}
