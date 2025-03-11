/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {
  LitElementDeclaration,
  PackageJson,
  getImportsStringForReferences,
} from '@lit-labs/analyzer';
import {
  ReactiveProperty as ModelProperty,
  Event as EventModel,
  Reference,
} from '@lit-labs/analyzer/lib/model.js';
import {javascript} from '@lit-labs/gen-utils/lib/str-utils.js';

const getTypeReferencesForMap = (
  map: Map<string, ModelProperty | EventModel>
) => Array.from(map.values()).flatMap((e) => e.type?.references ?? []);

const getElementTypeImports = (declarations: LitElementDeclaration[]) => {
  const refs: Reference[] = [];
  declarations.forEach((declaration) => {
    const {/*events,*/ reactiveProperties} = declaration;
    refs.push(
      // TODO(sorvell): Add event types.
      //...getTypeReferencesForMap(events),
      ...getTypeReferencesForMap(reactiveProperties)
    );
  });
  return getImportsStringForReferences(refs);
};

// TODO(sorvell): add support for getting exports in analyzer.
const getElementTypeExportsFromImports = (imports: string) =>
  imports.replace(/(?:^import)/gm, 'export type');

export const wrapperModuleTemplate = (
  packageJson: PackageJson,
  moduleJsPath: string,
  elements: LitElementDeclaration[]
) => {
  const imports = [`Component`, `ElementRef`, `NgZone`];
  if (elements.filter((e) => e.reactiveProperties.size).length > 0) {
    imports.push(`Input`);
  }
  if (elements.filter((e) => e.events.size).length > 0) {
    imports.push(`EventEmitter`, `Output`);
  }
  const typeImports = getElementTypeImports(elements);
  const typeExports = getElementTypeExportsFromImports(typeImports);
  moduleJsPath = moduleJsPath.replace(/\\/g, '/');
  return javascript`import {
  ${imports.join(',\n  ')}

} from '@angular/core';
${typeImports}
${typeExports}
${elements.map(
  (
    element
  ) => javascript`import type {${element.name} as ${element.name}Element} from '${packageJson.name}/${moduleJsPath}';
import '${packageJson.name}/${moduleJsPath}';`
)}

${elements.map((element) => wrapperTemplate(element))}
`;
};

const wrapperTemplate = (element: LitElementDeclaration) => {
  const {name, tagname, events, reactiveProperties} = element;
  const requiresNgZone = reactiveProperties.size > 0;
  const requiresEl = reactiveProperties.size > 0 || events.size > 0;
  return javascript`@Component({
  selector: '${tagname}',
  template: '<ng-content></ng-content>',
  standalone: true,
  imports: []
})
export class ${name} {
  ${requiresEl ? javascript`private _el: ${name}Element;` : ''}
  ${requiresNgZone ? javascript`private _ngZone: NgZone;` : ''}

  constructor(
    ${requiresEl ? 'e' : '_e'}: ElementRef<${name}Element>,
    ${requiresNgZone ? 'ngZone' : '_ngZone'}: NgZone
  ) {
    ${requiresEl ? javascript`this._el = e.nativeElement;` : ''}
    ${requiresNgZone ? javascript`this._ngZone = ngZone;` : ''}
    ${Array.from(events.keys()).map((eventName) => {
      const eventType = events.get(eventName)!.type?.text;
      return javascript`
    this._el.addEventListener('${eventName}', (e: Event) => {
      // TODO(justinfagnani): we need to let the element say how to get a value
      // from an event, ex: e.value
      this.${eventToPropertyName(eventName)}Event.emit(${eventType ? javascript`e as ${eventType}` : 'e'});
    });
    `;
    })}
  }

  ${Array.from(reactiveProperties.entries()).map(
    ([propertyName, property]) => javascript`
  @Input()
  set ${propertyName}(v: ${property.type?.text ?? 'any'}) {
    this._ngZone.runOutsideAngular(() => (this._el.${propertyName} = v));
  }

  get ${propertyName}() {
    return this._el.${propertyName};
  }
  `
  )}

  ${Array.from(events.keys()).map(
    (eventName) => javascript`
  @Output()
  ${eventToPropertyName(eventName)}Event = new EventEmitter<${
    events.get(eventName)!.type?.text || `unknown`
  }>();
  `
  )}
}
`;
};

const eventToPropertyName = (eventName: string) =>
  eventName.replace(/-+([a-zA-Z])/g, (_, c) => c.toUpperCase());
