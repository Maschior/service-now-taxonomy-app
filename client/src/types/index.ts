export interface Application {
  _id: string;
  name: string;
  workspaceId: string;
  isActive: boolean;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Module {
  _id: string;
  name: string;
  applicationId: string | Application;
  workspaceId: string;
  isActive: boolean;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Incident {
  _id: string;
  name: string;
  moduleIds: (string | Module)[];
  workspaceId: string;
  isActive: boolean;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Action {
  _id: string;
  name: string;
  incidentIds: (string | Incident)[];
  workspaceId: string;
  isActive: boolean;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TagCategory {
  _id: string;
  name: string;
  workspaceId: string;
  isActive: boolean;
  description?: string;
  createdAt: string;
}

export interface Tag {
  _id: string;
  name: string;
  categoryId: string | TagCategory;
  workspaceId: string;
  isActive: boolean;
  description?: string;
  createdAt: string;
}

export interface Closure {
  _id: string;
  shortDescription: string;
  resolutionNotes: string;
  applicationId?: string | Application;
  moduleId?: string | Module;
  incidentId?: string | Incident;
  actionId?: string | Action;
  tags: (string | Tag)[];
  motivo: string;
  analise: string;
  solucao: string;
  createdAt: string;
}

export interface TaxonomyData {
  applications: Application[];
  modules: Module[];
  incidents: Incident[];
  actions: Action[];
  tags: Tag[];
  tagCategories: TagCategory[];
}
