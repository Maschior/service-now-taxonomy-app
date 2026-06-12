import { useState, useEffect } from 'react';
import { closureApi, handleApiError } from '../services/api';
import { Closure } from '../types';

export default function ClosuresPage() {
  const [closures, setClosures] = useState<Closure[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchClosures();
  }, []);

  const fetchClosures = async () => {
    try {
      setLoading(true);
      const res = await closureApi.getAll();
      setClosures(res.data.data);
    } catch (err) {
      console.error(handleApiError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fade-in-up">
      <h1 className="text-2xl font-bold mb-6">Fechamentos Registrados</h1>
      <div className="section-card p-6">
        {loading ? <p>Carregando...</p> : <p>{closures.length} fechamentos carregados.</p>}
      </div>
    </div>
  );
}
