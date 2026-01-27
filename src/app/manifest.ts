import { MetadataRoute } from 'next'
 
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Portal do Aluno EBD',
    short_name: 'Portal EBD',
    description: 'Plataforma de estudos da Escola Bíblica Dominical.',
    start_url: '/',
    display: 'standalone',
    background_color: '#000000',
    theme_color: '#000000',
    icons: [
      {
        src: '/thumb.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/thumb.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  }
}
