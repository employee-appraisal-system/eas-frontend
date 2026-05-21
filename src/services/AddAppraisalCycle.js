const BASE_URL = process.env.REACT_APP_BASE_URL;

export const createAppraisalCycle = async (cycleData) => {
  const response = await fetch(`${BASE_URL}/appraisal_cycle/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(cycleData),
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || 'Failed to create appraisal cycle');
  }
  return response.json();
};

export const createStage = async (stageData) => {
  const response = await fetch(`${BASE_URL}/stages/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(stageData),
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || 'Failed to create stage');
  }
  return response.json();
};

export const createParameter = async (parameterData) => {
  const response = await fetch(`${BASE_URL}/parameters/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(parameterData),
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || 'Failed to create parameter');
  }
  return response.json();
};

export const fetchAppraisalCycles = async () => {
  try {
    const response = await fetch(
      `${BASE_URL}/appraisal_cycle/with-stage-names`,
      {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      }
    );

    return await response.json();
  } catch (error) {
    console.error('Error while fetching appraisal cycles:', error);
  }
};

export const deleteAppraisalCycle = async (cycle_id) => {
  try {
    const response = await fetch(`${BASE_URL}/appraisal_cycle/${cycle_id}`, {
      method: 'DELETE',
    });

    return await response.json();
  } catch (error) {
    console.error('Error while deleting appraisal cycle:', error);
  }
};
