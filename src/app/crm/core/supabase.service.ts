import { Injectable, signal } from '@angular/core';
import { createClient, Session, SupabaseClient } from '@supabase/supabase-js';
import { CRM_CONFIG } from '../crm.config';

/** Cliente único do Supabase + sessão do usuário como signal. */
@Injectable({ providedIn: 'root' })
export class SupabaseService {
  readonly client: SupabaseClient = createClient(CRM_CONFIG.supabaseUrl, CRM_CONFIG.supabaseKey, {
    auth: { persistSession: true, autoRefreshToken: true, storageKey: 'ionext-crm-auth' },
  });

  readonly session = signal<Session | null>(null);
  private readonly ready: Promise<void>;

  constructor() {
    this.ready = this.client.auth.getSession().then(({ data }) => this.session.set(data.session));
    this.client.auth.onAuthStateChange((_event, session) => this.session.set(session));
  }

  /** Aguarda a leitura da sessão salva antes de decidir rotas protegidas. */
  async currentSession(): Promise<Session | null> {
    await this.ready;
    return this.session();
  }
}
