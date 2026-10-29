# 3d-portfolio

Portfolio site for my 3D modeling and game developer work.

## Tech Stack

- React
- Tailwind CSS
- Three.js

<!-- stdd:start -->
## Comandos
- Tests de aceptación: node --test "tests/acceptance/<feature>/**/*.test.*" (ESM: archivos .test.js o .test.mjs)
- Todos los tests: node --test "tests/**/*.test.*" y los checks existentes (npm run check:buffer, check:cel, check:snap, check:moon, check:carousel, check:contrast)
- Lint: npm run lint
- Typecheck: no aplica (JS); en su lugar, npm run build debe compilar

## Flujo de trabajo (Spec + Test Driven)
Toda feature se lanza con `/feature <idea>` y sigue: spec corta → tests de aceptación que fallan → implementación mínima hasta verde → una revisión.
- `<feature>` = `<NNN>-<nombre>`: carpeta `specs/<feature>/`, tests en `tests/acceptance/<feature>/`, rama `feature/<feature>`.
- Nivel S (cambio local, 1–2 archivos, ≤ 3 criterios): sin Planner ni plan.md. Test que falla primero, luego código.
- Nivel M (una feature): Planner, 1–4 tareas.
- Nivel L (varias partes del sistema): Planner, máximo 8 tareas. Más de 8 = dividir en varias features M.
- Agentes (`.claude/agents/`): planner (plan + tests), builder / builder-rapido (implementan), reviewer (una revisión por feature, solo lectura).
- browser: comprobaciones de navegador del checklist tests/acceptance/<feature>/browser.md; solo lo lanza el Orchestrator. Nadie más arranca el servidor de desarrollo ni usa el navegador.

## Reglas de simplicidad
- Implementa la solución más simple que haga pasar los tests de aceptación.
- No añadas abstracciones, capas, configurabilidad, ni manejo de casos que no estén en los criterios de aceptación.
- No crees archivos de documentación, resúmenes ni informes salvo que se pidan.
- Respeta los no-objetivos de la spec: si algo parece necesario y está fuera, se reporta, no se hace.

## Reglas sobre tests
- tests/acceptance/ es el contrato. Solo el Planner lo escribe (o el builder en nivel S, antes de implementar); nadie más lo modifica.
- Si un test de aceptación parece incorrecto, se reporta como TEST_ISSUE con el motivo; nunca se edita, salta ni debilita.
- Tests unitarios adicionales solo para lógica con ramas o cálculos delicados, y en tests/unit/.
- Prohibido: hardcodear resultados esperados, detectar el entorno de test, mockear lo que el test verifica.

## Contexto
- Trabaja con el contexto que recibes en el paquete de tarea. Usa grep/glob solo para leer código concreto que necesites, no para buscar tu tarea o la spec.
- No leas specs/ de otras features.

## Git
- Una rama por feature: feature/<feature>. Nunca se trabaja en la rama principal.
- Commits solo del Orchestrator, en este orden: spec → contrato (plan + tests) → un commit por tarea → fix de revisión.
- Mensajes: <tipo>(<feature>): <qué>, con tipo en spec, test, feat, fix, refactor.
- Los subagentes solo usan git para leer (status, diff, log).
- Prohibido sin OK del usuario: push, merge a la rama principal, rebase, reset --hard, force.
<!-- stdd:end -->
