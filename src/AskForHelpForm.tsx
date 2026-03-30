import { useState, useEffect, useRef } from 'react';

// Tipizarea datelor formularului
interface FormData {
  titlu: string;
  tipCerere: 'Fizic' | 'Online' | '';
  urgenta: 'Ușor' | 'Mediu' | 'Greu' | '';
}

interface FormErrors {
  titlu?: string;
  tipCerere?: string;
  urgenta?: string;
}

export const AskForHelpForm = () => {
  const [formData, setFormData] = useState<FormData>({
    titlu: '',
    tipCerere: '',
    urgenta: '',
  });
  
  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);

  // State pentru animatia butonului
  const [isButtonVisible, setIsButtonVisible] = useState(false);
  const triggerRef = useRef<HTMLDivElement>(null);

  // Logica pt aparitia butonului la scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        setIsButtonVisible(entries[0].isIntersecting);
      },
      { threshold: 0 }
    );

    if (triggerRef.current) {
      observer.observe(triggerRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const validateForm = () => {
    const newErrors: FormErrors = {};
    let valid = true;

    if (!formData.titlu.trim()) {
      newErrors.titlu = 'Câmp obligatoriu';
      valid = false;
    }
    if (!formData.tipCerere) {
      newErrors.tipCerere = 'Câmp obligatoriu';
      valid = false;
    }
    if (!formData.urgenta) {
      newErrors.urgenta = 'Câmp obligatoriu';
      valid = false;
    }

    setErrors(newErrors);
    return valid;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    
    // Simulare API
    console.log('Date trimise:', formData);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    
    setIsLoading(false);
    alert('✅ Cererea a fost trimisă cu succes!');
  };

  return (
    <div className="w-full max-w-2xl flex flex-col gap-6 relative">

      {/* CARDUL PRINCIPAL (z-20 pentru a sta deasupra butonului) */}
      <div className="p-8 md:p-12 bg-white border border-gray-100 shadow-sm rounded-3xl flex flex-col gap-8 relative z-20">
        
        <div>
          <h2 className="text-2xl font-bold text-gray-950 mb-2">Solicitare Ajutor</h2>
          <p className="text-gray-500 text-sm">Completează detaliile de bază pentru cererea ta.</p>
        </div>

        {/* TITLUL CERERII */}
        <div className="flex flex-col gap-2">
          <label className="font-bold text-gray-900">Titlul cererii <span className="text-red-500">*</span></label>
          <input
            type="text"
            value={formData.titlu}
            onChange={(e) => {
              setFormData({ ...formData, titlu: e.target.value });
              if (errors.titlu) setErrors({ ...errors, titlu: undefined });
            }}
            placeholder="Ex: Ridicare medicamente de la farmacie"
            className={`w-full px-5 py-4 rounded-xl border transition-all outline-none 
              ${errors.titlu 
                ? 'border-red-400 focus:border-red-500 focus:ring-4 focus:ring-red-50' 
                : 'border-gray-200 focus:border-purple-500 focus:ring-4 focus:ring-purple-50 placeholder-gray-400'
              }`}
          />
          {errors.titlu && <span className="text-red-500 text-sm font-medium pl-1">{errors.titlu}</span>}
        </div>

        {/* TIPUL CERERII */}
        <div className="flex flex-col gap-3">
          <label className="font-bold text-gray-900">Tipul cererii <span className="text-red-500">*</span></label>
          <div className="grid grid-cols-2 gap-4">
            {['Fizic', 'Online'].map((type) => (
              <label
                key={type}
                className={`flex items-center justify-center gap-3 cursor-pointer px-6 py-4 rounded-xl border-2 transition-all 
                  ${formData.tipCerere === type 
                    ? 'border-purple-600 bg-purple-50' 
                    : errors.tipCerere ? 'border-red-200 bg-red-50/30' : 'border-gray-100 bg-gray-50 hover:border-gray-200'
                  }`}
              >
                <input
                  type="radio"
                  name="tipCerere"
                  checked={formData.tipCerere === type}
                  onChange={() => {
                    setFormData({ ...formData, tipCerere: type as 'Fizic' | 'Online' });
                    if (errors.tipCerere) setErrors({ ...errors, tipCerere: undefined });
                  }}
                  className="hidden" 
                />
                <span className={`font-semibold text-lg ${formData.tipCerere === type ? 'text-purple-900' : 'text-gray-700'}`}>
                  {type === 'Fizic' ? '📍 Fizic' : '🌐 Online'}
                </span>
              </label>
            ))}
          </div>
          {errors.tipCerere && <span className="text-red-500 text-sm font-medium pl-1">{errors.tipCerere}</span>}
        </div>

        {/* NIVEL DE URGENȚĂ */}
        <div className="flex flex-col gap-3">
          <label className="font-bold text-gray-900">Nivel de urgență <span className="text-red-500">*</span></label>
          <div className="grid grid-cols-3 gap-3">
            {/* Ușor */}
            <button
              type="button"
              onClick={() => {
                setFormData({ ...formData, urgenta: 'Ușor' });
                if (errors.urgenta) setErrors({ ...errors, urgenta: undefined });
              }}
              className={`py-3 px-4 rounded-xl font-bold border-2 transition-all
                ${formData.urgenta === 'Ușor' 
                  ? 'bg-green-500 border-green-500 text-white shadow-md shadow-green-200' 
                  : 'bg-white border-green-200 text-green-600 hover:bg-green-50'
                }`}
            >
              Ușor
            </button>
            
            {/* Mediu */}
            <button
              type="button"
              onClick={() => {
                setFormData({ ...formData, urgenta: 'Mediu' });
                if (errors.urgenta) setErrors({ ...errors, urgenta: undefined });
              }}
              className={`py-3 px-4 rounded-xl font-bold border-2 transition-all
                ${formData.urgenta === 'Mediu' 
                  ? 'bg-orange-500 border-orange-500 text-white shadow-md shadow-orange-200' 
                  : 'bg-white border-orange-200 text-orange-500 hover:bg-orange-50'
                }`}
            >
              Mediu
            </button>

            {/* Greu */}
            <button
              type="button"
              onClick={() => {
                setFormData({ ...formData, urgenta: 'Greu' });
                if (errors.urgenta) setErrors({ ...errors, urgenta: undefined });
              }}
              className={`py-3 px-4 rounded-xl font-bold border-2 transition-all
                ${formData.urgenta === 'Greu' 
                  ? 'bg-red-500 border-red-500 text-white shadow-md shadow-red-200' 
                  : 'bg-white border-red-200 text-red-500 hover:bg-red-50'
                }`}
            >
              Greu
            </button>
          </div>
          {errors.urgenta && <span className="text-red-500 text-sm font-medium pl-1">{errors.urgenta}</span>}
        </div>

      </div>

      {/* SENZORUL PENTRU SCROLL */}
      <div ref={triggerRef} className="h-1 w-full" aria-hidden="true"></div>

      {/* BUTONUL CARE IESE DE SUB FORMULAR (z-10) */}
      <div className="relative z-10 -mt-12 pt-12">
        <div
          className={`flex justify-end transition-all duration-700 ease-in-out ${
            isButtonVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-20 pointer-events-none'
          }`}
        >
          <button
            onClick={handleSubmit}
            disabled={isLoading}
            className={`group relative overflow-hidden text-white rounded-[12px] px-10 py-4 font-semibold shadow-lg text-lg transition-all
              ${isLoading ? 'bg-gray-400 cursor-not-allowed' : 'bg-black'}
            `}
          >
            {!isLoading && (
              <div className="absolute inset-0 w-0 bg-purple-600 transition-all duration-500 ease-out group-hover:w-full"></div>
            )}

            <span className="relative z-10 flex items-center gap-2">
              {isLoading ? 'Se procesează...' : 'Continuă'}
              {!isLoading && (
                <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
              )}
            </span>
          </button>
        </div>
      </div>

    </div>
  );
};