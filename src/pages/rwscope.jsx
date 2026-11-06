// Œuvre « résumé illustré » courante (La Boîte à merveilles, Candide…) : données de lecture et kit d'écriture
import { createContext, useContext } from 'react'
import { RES_WORKS } from '../lib/items'

const Ctx = createContext(RES_WORKS.bam)

export function RWScope({ wid, children }) {
  return <Ctx.Provider value={RES_WORKS[wid]}>{children}</Ctx.Provider>
}

export function useRW() {
  return useContext(Ctx)
}
