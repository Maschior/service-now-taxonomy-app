import { useState, useEffect, useCallback } from 'react';
import { applicationApi, moduleApi, incidentApi, actionApi, tagApi, handleApiError } from '../services/api';
import { Application, Module, Incident, Action, Tag as TagType, TagCategory } from '../types/index';

export function useTaxonomyData() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [allModules, setAllModules] = useState<Module[]>([]);
  const [allIncidents, setAllIncidents] = useState<Incident[]>([]);
  const [allActions, setAllActions] = useState<Action[]>([]);
  const [tags, setTags] = useState<TagType[]>([]);
  const [tagCategories, setTagCategories] = useState<TagCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAllData = useCallback(async (isInitial: boolean) => {
    try {
      if (isInitial) setLoading(true);
      const [appsRes, modsRes, incsRes, actsRes, categoriesRes, tagsRes] = await Promise.all([
        applicationApi.getAll(),
        moduleApi.getAll(),
        incidentApi.getAll({}),
        actionApi.getAll({}),
        tagApi.getCategories(),
        tagApi.getAll(),
      ]);

      setApplications(appsRes.data);
      setAllModules(modsRes.data);
      setAllIncidents(incsRes.data);
      setAllActions(actsRes.data);
      setTagCategories(categoriesRes.data);
      setTags(tagsRes.data);
      setError(null);
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      if (isInitial) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllData(true);
  }, [fetchAllData]);

  return {
    applications,
    allModules,
    allIncidents,
    allActions,
    tags,
    tagCategories,
    loading,
    error,
    setError,
    refetch: () => fetchAllData(false)
  };
}
