import { ChangeDetectionStrategy, Component, input, model } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CustomValues, FieldDefinition } from '../core/crm.models';

/** Renderiza os campos personalizados do nicho a partir de field_definitions. */
@Component({
  selector: 'crm-dynamic-fields',
  imports: [FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @for (f of fields(); track f.id) {
      <label class="field" [class.span-all]="f.tipo === 'textarea'">
        <span>{{ f.rotulo }} @if (f.obrigatorio) { <b class="req">*</b> }</span>
        @switch (f.tipo) {
          @case ('textarea') {
            <textarea class="textarea" [name]="f.chave" [required]="f.obrigatorio"
              [ngModel]="values()[f.chave] ?? ''" (ngModelChange)="set(f.chave, $event)"></textarea>
          }
          @case ('select') {
            <select class="select" [name]="f.chave" [required]="f.obrigatorio"
              [ngModel]="values()[f.chave] ?? ''" (ngModelChange)="set(f.chave, $event)">
              <option value="">Selecione…</option>
              @for (o of f.opcoes; track o) { <option [value]="o">{{ o }}</option> }
            </select>
          }
          @case ('booleano') {
            <span class="check">
              <input type="checkbox" [name]="f.chave"
                [ngModel]="!!values()[f.chave]" (ngModelChange)="set(f.chave, $event)" /> Sim
            </span>
          }
          @case ('numero') {
            <input class="input" type="number" inputmode="numeric" [name]="f.chave" [required]="f.obrigatorio"
              [ngModel]="values()[f.chave] ?? null" (ngModelChange)="set(f.chave, $event)" />
          }
          @case ('moeda') {
            <input class="input" type="number" inputmode="decimal" step="0.01" min="0" placeholder="R$"
              [name]="f.chave" [required]="f.obrigatorio"
              [ngModel]="values()[f.chave] ?? null" (ngModelChange)="set(f.chave, $event)" />
          }
          @case ('data') {
            <input class="input" type="date" [name]="f.chave" [required]="f.obrigatorio"
              [ngModel]="values()[f.chave] ?? ''" (ngModelChange)="set(f.chave, $event)" />
          }
          @default {
            <input class="input"
              [type]="f.tipo === 'email' ? 'email' : f.tipo === 'telefone' ? 'tel' : 'text'"
              [name]="f.chave" [required]="f.obrigatorio"
              [ngModel]="values()[f.chave] ?? ''" (ngModelChange)="set(f.chave, $event)" />
          }
        }
      </label>
    }
  `,
  styles: `:host { display: contents; }`,
})
export class DynamicFieldsComponent {
  readonly fields = input.required<FieldDefinition[]>();
  readonly values = model<CustomValues>({});

  protected set(chave: string, value: string | number | boolean | null): void {
    const clean = value === '' ? null : value;
    this.values.update((v) => ({ ...v, [chave]: clean }));
  }
}

/** Formata um valor personalizado para exibição em listas. */
export function formatCustom(field: FieldDefinition, value: unknown): string {
  if (value === null || value === undefined || value === '') return '—';
  switch (field.tipo) {
    case 'moeda':
      return Number(value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    case 'data': {
      const [y, m, d] = String(value).split('-');
      return d && m && y ? `${d}/${m}/${y}` : String(value);
    }
    case 'booleano':
      return value ? 'Sim' : 'Não';
    default:
      return String(value);
  }
}

/** Campos obrigatórios não preenchidos (validação antes de salvar). */
export function missingRequired(fields: FieldDefinition[], values: CustomValues): string[] {
  return fields
    .filter((f) => f.obrigatorio && (values[f.chave] === null || values[f.chave] === undefined || values[f.chave] === ''))
    .map((f) => f.rotulo);
}

/** Data/hora em pt-BR sem depender do locale do Angular (o site usa en-US). */
export function formatDateTime(iso: string, weekday = false): string {
  const d = new Date(iso);
  const date = d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', ...(weekday ? { weekday: 'short' } : {}) });
  const time = d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  return `${date.replace('.', '')} · ${time}`;
}
