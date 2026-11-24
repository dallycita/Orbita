/**
 * (encabezado pendiente)
 */
import { tutorial } from '../08-partida-estado.js';
import { misEvent } from './missions.js';

/**
 * Lee las estrellas ganadas en un nivel.
 *
 * @param {number} i Índice del nivel en LEVELS.
 * @returns {number[]} Las estrellas conseguidas (lista vacía si no hay o no hay localStorage).
 */
function lvStarsGot(i) {
  try {
    const all = JSON.parse(localStorage.getItem('orbita_lvstars') || '{}');
    return Array.isArray(all[i]) ? all[i] : [];
  } catch (e) {
    return [];
  }
}

// Antes de jugar solo se muestra dónde estás y "toca para escapar"; la ayuda con íconos se muestra
// hasta que se domina el salto doble (cuenta guardada en `orbita_p1_dobles`).
let doblesHechos = 0;

/**
 * Cuenta un salto doble hecho (fuera del tutorial) y avanza la misión de poderes.
 */
function noteDouble() {
  if (tutorial) {
    return;
  }
  misEvent('power');
  doblesHechos++;
  try {
    localStorage.setItem('orbita_p1_dobles', String(doblesHechos));
  } catch (e) {}
}

/**
 * Cambia `doblesHechos` desde otro módulo (este módulo es su dueño).
 *
 * @param {*} value Valor nuevo.
 * @returns {*} El mismo valor, como el de una asignación.
 */
function setDoblesHechos(value) {
  doblesHechos = value;
  return value;
}

export { doblesHechos, lvStarsGot, noteDouble, setDoblesHechos };
