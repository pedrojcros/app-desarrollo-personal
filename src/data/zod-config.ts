import { z } from 'zod';

// La CSP de la web no permite eval; sin JIT, Zod valida igual y no intenta
// generar funciones que el navegador bloquearía incluso durante su detección.
z.config({ jitless: true });
