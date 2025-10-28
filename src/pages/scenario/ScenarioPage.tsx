import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { ScenarioListView } from './components/ScenarioListView';
import { ScenarioDashboard } from './components/ScenarioDashboard';

export const ScenarioPage = () => {
  return (
    <Routes>
      <Route index element={<ScenarioListView />} />
      <Route path=":scenarioId" element={<ScenarioDashboard />} />
    </Routes>
  );
};
