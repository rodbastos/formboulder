'use client';

import { useState } from 'react';
import SignaturePad from 'react-signature-canvas';
import emailjs from '@emailjs/browser';

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
  const [loading, setLoading] = useState(false);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    
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
        setLoading(true);

        // Initialize EmailJS right before sending
        emailjs.init(process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY || '');

        const templateParams = {
          to_email: formData.email,
          to_name: formData.nomeCompleto,
          from_name: 'Form Boulder Campos do Jordão',
          message: `
Data de Nascimento: ${new Date(formData.dataNascimento).toLocaleDateString('pt-BR')}
Documento: ${formData.documento}
Telefone para emergência: ${formData.telefoneEmergencia}
${formData.registrarFilhos ? `\nNomes dos filhos:\n${formData.nomesFilhos}` : ''}
          `,
          signature: signatureData,
        };

        // Send to Google Sheets via our API route
        try {
          const sheetResponse = await fetch('/api/sheets', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              nome: formData.nomeCompleto,
              email: formData.email,
              mensagem: `
Data de Nascimento: ${new Date(formData.dataNascimento).toLocaleDateString('pt-BR')}
Documento: ${formData.documento}
Telefone para emergência: ${formData.telefoneEmergencia}
${formData.registrarFilhos ? `\nNomes dos filhos:\n${formData.nomesFilhos}` : ''}
Assinatura: ${signatureData}
              `
            }),
          });

          const sheetResult = await sheetResponse.json();
          console.log('Google Sheets result:', sheetResult);

          if (!sheetResult.success) {
            throw new Error(sheetResult.error || 'Erro ao salvar no Google Sheets');
          }
        } catch (err) {
          console.error('Error saving to Google Sheets:', err);
          // Continue with email sending even if sheets fails
        }

        // Send email to user
        console.log('Sending email to user:', formData.email);
        const userEmailResult = await emailjs.send(
          process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID || '',
          process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID || '',
          {
            ...templateParams,
            to_email: formData.email,
          }
        );
        console.log('User email result:', userEmailResult);

        // Send notification to admin
        console.log('Sending email to admin');
        const adminEmailResult = await emailjs.send(
          process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID || '',
          process.env.NEXT_PUBLIC_EMAILJS_ADMIN_TEMPLATE_ID || '',
          {
            ...templateParams,
            to_email: 'rodrigo@targetteal.com',
          }
        );
        console.log('Admin email result:', adminEmailResult);

        // Clear form
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
      } catch (err) {
        console.error('Error submitting form:', err);
        setError('Erro ao enviar o formulário. Por favor, tente novamente.');
      } finally {
        setLoading(false);
      }
    } else {
      setError('Por favor, adicione sua assinatura.');
    }
  };

  return (
    <main className="min-h-screen p-8 max-w-4xl mx-auto bg-white dark:bg-gray-900">
      <h1 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">Termo de Consentimento - Escalada Boulder Campos do Jordão</h1>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="nomeCompleto" className="block text-sm font-medium text-gray-900 dark:text-gray-200">
            Nome Completo
          </label>
          <input
            type="text"
            id="nomeCompleto"
            name="nomeCompleto"
            required
            value={formData.nomeCompleto}
            onChange={handleInputChange}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white dark:bg-gray-800 dark:border-gray-600 dark:text-white"
          />
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-900 dark:text-gray-200">
            E-mail
          </label>
          <input
            type="email"
            id="email"
            name="email"
            required
            value={formData.email}
            onChange={handleInputChange}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white dark:bg-gray-800 dark:border-gray-600 dark:text-white"
          />
        </div>

        <div>
          <label htmlFor="dataNascimento" className="block text-sm font-medium text-gray-900 dark:text-gray-200">
            Data de Nascimento
          </label>
          <input
            type="date"
            id="dataNascimento"
            name="dataNascimento"
            required
            value={formData.dataNascimento}
            onChange={handleInputChange}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white dark:bg-gray-800 dark:border-gray-600 dark:text-white"
          />
        </div>

        <div>
          <label htmlFor="documento" className="block text-sm font-medium text-gray-900 dark:text-gray-200">
            Documento de Identificação (RG/CPF)
          </label>
          <input
            type="text"
            id="documento"
            name="documento"
            required
            value={formData.documento}
            onChange={handleInputChange}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white dark:bg-gray-800 dark:border-gray-600 dark:text-white"
          />
        </div>

        <div>
          <label htmlFor="telefoneEmergencia" className="block text-sm font-medium text-gray-900 dark:text-gray-200">
            Telefone para Emergência
          </label>
          <input
            type="tel"
            id="telefoneEmergencia"
            name="telefoneEmergencia"
            required
            value={formData.telefoneEmergencia}
            onChange={handleInputChange}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white dark:bg-gray-800 dark:border-gray-600 dark:text-white"
          />
        </div>

        <div>
          <label className="flex items-center text-gray-900 dark:text-gray-200">
            <input
              type="checkbox"
              name="registrarFilhos"
              checked={formData.registrarFilhos}
              onChange={handleInputChange}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <span className="ml-2">Registrar filhos menores de idade</span>
          </label>
        </div>

        {formData.registrarFilhos && (
          <div>
            <label htmlFor="nomesFilhos" className="block text-sm font-medium text-gray-900 dark:text-gray-200">
              Nomes dos Filhos
            </label>
            <textarea
              id="nomesFilhos"
              name="nomesFilhos"
              value={formData.nomesFilhos}
              onChange={handleInputChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white dark:bg-gray-800 dark:border-gray-600 dark:text-white"
              rows={3}
            />
          </div>
        )}

        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Termo de Consentimento e Isenção de Responsabilidade</h2>
          <div className="prose dark:prose-invert">
            <p className="text-gray-900 dark:text-gray-200">
              Eu, declaro que:
            </p>
            <ul className="list-disc pl-5 text-gray-900 dark:text-gray-200">
              <li>Tenho 18 anos ou mais, sendo legalmente responsável por minhas decisões e assumindo os riscos envolvidos na prática da Escalada Esportiva – Modalidade Boulder.</li>
              <li>Estou ciente dos riscos inerentes à prática, incluindo:
                <ul className="list-disc pl-5">
                  <li>Quedas e impactos contra o solo ou paredes</li>
                  <li>Lesões como torções, contusões e fraturas</li>
                  <li>Riscos associados ao uso inadequado da estrutura ou falta de experiência</li>
                </ul>
              </li>
              <li>Estou ciente de que não há supervisão profissional fornecida pela Prefeitura.</li>
              <li>Reconheço que o muro recebe manutenção pela comunidade local de escaladores.</li>
            </ul>
          </div>
        </div>

        <div>
          <label className="flex items-center text-gray-900 dark:text-gray-200">
            <input
              type="checkbox"
              name="aceitaTermos"
              checked={formData.aceitaTermos}
              onChange={handleInputChange}
              required
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <span className="ml-2">Li e aceito os termos acima</span>
          </label>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-900 dark:text-gray-200">
            Assinatura Digital
          </label>
          <div className="mt-1 border border-gray-300 rounded-md bg-white">
            <SignaturePad
              ref={(ref) => setSignaturePad(ref)}
              canvasProps={{
                className: 'w-full h-48',
              }}
            />
          </div>
        </div>

        <button
          type="submit"
          className="w-full py-2 px-4 bg-blue-600 text-white rounded hover:bg-blue-700 mt-8 disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={loading}
        >
          {loading ? 'Enviando...' : 'Enviar Formulário'}
        </button>
      </form>
    </main>
  );
}
