'use client';

import { useState } from 'react';
import SignaturePad from 'react-signature-canvas';

export default function Home() {
  const [formData, setFormData] = useState({
    nomeCompleto: '',
    email: '',
    dataNascimento: '',
    documento: '',
    telefoneEmergencia: '',
    registrarFilhos: false,
    nomesFilhos: '',
    aceitaTermos: false,
  });
  const [signaturePad, setSignaturePad] = useState<SignaturePad | null>(null);
  const [error, setError] = useState('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const validateAge = (birthDate: string) => {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    
    return age >= 18;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateAge(formData.dataNascimento)) {
      setError('Apenas maiores de 18 anos podem assinar.');
      return;
    }

    if (!formData.aceitaTermos) {
      setError('Você precisa aceitar os termos para continuar.');
      return;
    }

    if (!signaturePad?.isEmpty()) {
      const signatureData = signaturePad?.toDataURL();
      
      try {
        setError('');
        const response = await fetch('/api/send-email', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...formData,
            signature: signatureData,
          }),
        });

        if (!response.ok) {
          throw new Error('Erro ao enviar o formulário');
        }

        // Clear form and signature
        setFormData({
          nomeCompleto: '',
          email: '',
          dataNascimento: '',
          documento: '',
          telefoneEmergencia: '',
          registrarFilhos: false,
          nomesFilhos: '',
          aceitaTermos: false,
        });
        signaturePad?.clear();
        
        alert('Formulário enviado com sucesso! Verifique seu email.');
      } catch (error) {
        setError('Erro ao enviar o formulário. Por favor, tente novamente.');
      }
    } else {
      setError('Por favor, adicione sua assinatura.');
    }
  };

  return (
    <main className="min-h-screen p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Termo de Consentimento - Escalada Boulder</h1>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4">
          <div>
            <label htmlFor="nomeCompleto" className="block mb-1">Nome completo:</label>
            <input
              type="text"
              id="nomeCompleto"
              name="nomeCompleto"
              required
              className="w-full p-2 border rounded"
              value={formData.nomeCompleto}
              onChange={handleInputChange}
            />
          </div>

          <div>
            <label htmlFor="email" className="block mb-1">E-mail:</label>
            <input
              type="email"
              id="email"
              name="email"
              required
              className="w-full p-2 border rounded"
              value={formData.email}
              onChange={handleInputChange}
            />
          </div>

          <div>
            <label htmlFor="dataNascimento" className="block mb-1">Data de nascimento:</label>
            <input
              type="date"
              id="dataNascimento"
              name="dataNascimento"
              required
              className="w-full p-2 border rounded"
              value={formData.dataNascimento}
              onChange={handleInputChange}
            />
          </div>

          <div>
            <label htmlFor="documento" className="block mb-1">Documento de Identificação (CPF):</label>
            <input
              type="text"
              id="documento"
              name="documento"
              required
              className="w-full p-2 border rounded"
              value={formData.documento}
              onChange={handleInputChange}
            />
          </div>

          <div>
            <label htmlFor="telefoneEmergencia" className="block mb-1">Telefone para emergência:</label>
            <input
              type="tel"
              id="telefoneEmergencia"
              name="telefoneEmergencia"
              required
              className="w-full p-2 border rounded"
              value={formData.telefoneEmergencia}
              onChange={handleInputChange}
            />
          </div>
        </div>

        <div className="prose max-w-none">
          <h2 className="text-xl font-bold mt-8 mb-4">TERMO DE CONSENTIMENTO E ISENÇÃO DE RESPONSABILIDADE</h2>
          <h3 className="text-lg font-semibold">ESCALADA ESPORTIVA – MODALIDADE BOULDER</h3>
          
          <div className="bg-gray-50 p-4 rounded mt-4">
            <p>Eu, {formData.nomeCompleto || '[Nome do Participante]'}, portador(a) do documento de identificação {formData.documento || '[CPF]'}, declaro, para os devidos fins, que:</p>
            
            <ul className="list-disc pl-6 mt-4">
              <li>Tenho 18 anos ou mais, sendo legalmente responsável por minhas decisões e assumindo os riscos envolvidos na prática da Escalada Esportiva – Modalidade Boulder.</li>
              <li>Estou ciente de que a escalada no muro de boulder do centro esportivo da Prefeitura de Campos do Jordão envolve riscos inerentes, incluindo, mas não se limitando a:
                <ul className="list-disc pl-6">
                  <li>Quedas e impactos contra o solo ou paredes;</li>
                  <li>Lesões como torções, contusões e fraturas;</li>
                  <li>Riscos associados ao uso inadequado da estrutura ou falta de experiência.</li>
                </ul>
              </li>
              <li>Estou ciente de que não há supervisão profissional fornecida pela Prefeitura ou qualquer outro órgão público, sendo minha segurança de inteira responsabilidade.</li>
              <li>Reconheço que o muro de boulder recebe manutenção pela comunidade local de escaladores e que não há garantias formais quanto ao seu estado de conservação ou adequação para uso seguro.</li>
            </ul>
          </div>

          <div className="mt-6">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                name="registrarFilhos"
                checked={formData.registrarFilhos}
                onChange={handleInputChange}
                className="form-checkbox"
              />
              <span>Quero assinar também o termo para permitir que meu filho ou filha escale.</span>
            </label>
          </div>

          {formData.registrarFilhos && (
            <div className="mt-4">
              <label htmlFor="nomesFilhos" className="block mb-1">Nome completo do(s) filho(s):</label>
              <textarea
                id="nomesFilhos"
                name="nomesFilhos"
                className="w-full p-2 border rounded"
                value={formData.nomesFilhos}
                onChange={(e) => setFormData(prev => ({ ...prev, nomesFilhos: e.target.value }))}
                rows={3}
              />
              
              <div className="bg-gray-50 p-4 rounded mt-4">
                <h3 className="font-semibold">DECLARAÇÃO DE RESPONSABILIDADE ADICIONAL</h3>
                <p className="mt-2">Como responsável legal, assumo total responsabilidade pela segurança do(s) menor(es) durante a prática da Escalada Esportiva e me comprometo a supervisionar em tempo integral durante toda a atividade.</p>
              </div>
            </div>
          )}

          <div className="mt-6">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                name="aceitaTermos"
                required
                checked={formData.aceitaTermos}
                onChange={handleInputChange}
                className="form-checkbox"
              />
              <span>Confirmo que sou maior de 18 anos e aceito todos os termos acima.</span>
            </label>
          </div>
        </div>

        <div className="mt-8">
          <label className="block mb-1">Assinatura Digital:</label>
          <div className="border rounded bg-white">
            <SignaturePad
              ref={(ref) => setSignaturePad(ref)}
              canvasProps={{
                className: 'w-full h-40'
              }}
            />
          </div>
          <button
            type="button"
            onClick={() => signaturePad?.clear()}
            className="mt-2 px-4 py-2 bg-gray-200 rounded"
          >
            Limpar Assinatura
          </button>
        </div>

        <button
          type="submit"
          className="w-full py-2 px-4 bg-blue-600 text-white rounded hover:bg-blue-700 mt-8"
        >
          Enviar Formulário
        </button>
      </form>
    </main>
  );
}
