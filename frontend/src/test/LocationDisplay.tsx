import { useLocation } from 'react-router'

/** Expone la ruta actual del router para que los tests la comprueben. */
export function LocationDisplay() {
  return <output data-testid="location">{useLocation().pathname}</output>
}
