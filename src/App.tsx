import React from 'react';
import EmailVerification from './EmailVerification';

/**
 * Exemplu de utilizare a componentei EmailVerification
 */
const App: React.FC = () => {
  const handleVerificationComplete = (code: string) => {
    console.log('Cod verificat:', code);
    // Aici ar fi logica de navigare sau salvare
  };

  return (
    <div>
      <EmailVerification 
        email="utilizator@exemplu.ro"
        onVerificationComplete={handleVerificationComplete}
      />
    </div>
  );
};

export default App;