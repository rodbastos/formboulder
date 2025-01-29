import { NextResponse } from 'next/server';
import { Resend } from 'resend';

export const runtime = 'edge';

const resend = new Resend(process.env.RESEND_API_KEY);

const ADMIN_EMAILS = ['rodrigo@targetteal.com']; // Replace with actual admin emails

const generateEmailContent = (data: any) => {
  const childrenSection = data.registrarFilhos ? `
    <h2>Termo de Responsabilidade para Menor(es)</h2>
    <p>Nome(s) do(s) filho(s):</p>
    <p>${data.nomesFilhos}</p>
    <p>Como responsável legal, assumo total responsabilidade pela segurança do(s) menor(es) durante a prática da Escalada Esportiva e me comprometo a supervisionar em tempo integral durante toda a atividade.</p>
  ` : '';

  return `
    <h1>Termo de Consentimento - Escalada Boulder</h1>
    <p>Data do registro: ${new Date().toLocaleDateString('pt-BR')}</p>
    
    <h2>Dados do Participante</h2>
    <ul>
      <li>Nome: ${data.nomeCompleto}</li>
      <li>Email: ${data.email}</li>
      <li>Data de Nascimento: ${new Date(data.dataNascimento).toLocaleDateString('pt-BR')}</li>
      <li>Documento: ${data.documento}</li>
      <li>Telefone para emergência: ${data.telefoneEmergencia}</li>
    </ul>

    <h2>Termo de Consentimento e Isenção de Responsabilidade</h2>
    <p>Eu, ${data.nomeCompleto}, portador(a) do documento de identificação ${data.documento}, declaro que:</p>
    <ul>
      <li>Tenho 18 anos ou mais, sendo legalmente responsável por minhas decisões e assumindo os riscos envolvidos na prática da Escalada Esportiva – Modalidade Boulder.</li>
      <li>Estou ciente dos riscos inerentes à prática, incluindo:
        <ul>
          <li>Quedas e impactos contra o solo ou paredes</li>
          <li>Lesões como torções, contusões e fraturas</li>
          <li>Riscos associados ao uso inadequado da estrutura ou falta de experiência</li>
        </ul>
      </li>
      <li>Estou ciente de que não há supervisão profissional fornecida pela Prefeitura.</li>
      <li>Reconheço que o muro recebe manutenção pela comunidade local de escaladores.</li>
    </ul>

    ${childrenSection}

    <h2>Assinatura Digital</h2>
    <img src="${data.signature}" alt="Assinatura Digital" style="max-width: 100%; border: 1px solid #ccc; margin-top: 20px;" />
  `;
};

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const emailContent = generateEmailContent(data);

    // Send email to user
    await resend.emails.send({
      from: 'Form Boulder <noreply@formboulder.com>', // Replace with your verified domain
      to: [data.email],
      subject: 'Seu Termo de Consentimento - Escalada Boulder',
      html: emailContent,
    });

    // Send notifications to admins
    await Promise.all(
      ADMIN_EMAILS.map(adminEmail =>
        resend.emails.send({
          from: 'Form Boulder <noreply@formboulder.com>', // Replace with your verified domain
          to: [adminEmail],
          subject: `Novo Termo de Consentimento - ${data.nomeCompleto}`,
          html: emailContent,
        })
      )
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: 'Error sending email' },
      { status: 500 }
    );
  }
}
