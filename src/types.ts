export type Homme = {
  id: string
  prenom: string
  nom: string
  photoUrl: string
  couleur: string
  createdAt: number
}

export type ActionDef = {
  id: string
  libelle: string
  coefficient: number
  createdAt: number
}

export type Evenement = {
  id: string
  hommeId: string
  actionId: string
  points: number
  actionLibelle: string
  hommeLabel: string
  createdAt: number
}

export type AppData = {
  hommes: Homme[]
  actions: ActionDef[]
  evenements: Evenement[]
}

/** Profil admin synchronisé depuis Firebase Auth (document id = uid). */
export type AdminProfile = {
  id: string
  email: string
  createdAt: number
  updatedAt: number
}
