import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getLastMemoryPath } from '../shared/utils';
import { LoadingScreen } from '../shared/components/feedback';

const MemoryHome: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    navigate(getLastMemoryPath(), { replace: true });
  }, [navigate]);

  return <LoadingScreen />;
};

export default MemoryHome;
