# EHORA · Auditoría de la tienda en vivo (18 nov 2026)

Fuente: https://ehorabrand.myshopify.com/ rastreada en escritorio (1440 px) y móvil (Pixel 7 / iPhone 13).
Tema publicado: `ehora-maestra-3d-hero-video-v2` (id 210847203660, carpeta t/17). Idioma es.

## Estructura
- Menú: Inicio · Catálogo (/collections/all) · Paleteros · Presurizadores · Contacto. En escritorio «Contacto» salta a una 2.ª línea.
- Páginas que existen: home, 3 colecciones (+ «Página de inicio»), 3 productos, /pages/contact, /policies/privacy-policy, carrito, búsqueda, 404.
- NO existen (404): envíos, devoluciones, términos, información de contacto, sobre nosotros, preguntas frecuentes.
- Home (orden): portada · colección · el paletero (galería 5 fotos) · pádel o tenis · curva de presión + comparativa · reseñas (vacía, oculta) · la marca (pendiente, oculta) · 2 preguntas frecuentes · barra «Comprar» · pie.
- Pie: marca + Colección + Ayuda + boletín «Notas de EHORA»; solo icono PayPal; «© 2026, EHORA BRAND · Tecnología de Shopify · Política de privacidad».

## Productos (reales, publicados 13 nov)
- Paletero EHORA 64,99 € · opción Color: Negro (seleccionado por defecto), Blanco, Beige, Verde, Azul marino, Blanco ribete azul · todos disponibles · 25 fotos, solo 2 variantes con foto asociada.
- Presurizador automático 74,99 € (3 fotos) · Presurizador manual 29,99 € (1 foto).
- Descripciones completas y buenas (capacidad 2 palas/raquetas, 3 pelotas, USB-C, PSI…).

## Hallazgos
1. Esquemas de color rotos en Shopify: el CSS sale `.color- { --color-background: ,,; --gradient-background: ; }` ×5. Efectos: ninguna sección recibe su color (pie `footer color-` crema, no verde), y el cajón del menú móvil queda TRANSPARENTE (se lee sobre la foto/productos). Causa de fondo sin confirmar: tipografías y esquemas salen vacíos, los demás ajustes sí se aplican.
2. «Ver en 3D» aparece en las 3 fichas, también presurizadores, con título «Tu paletero, en 3D». Modelo: cdn.shopify.com/3d/models/o/5b076ef3f4d4cbd9/paletero-ehora-corregido.glb.
3. Paletero: color por defecto Negro pero la foto principal es el bolso blanco; pastillas de color sin estado seleccionado claro.
4. Home, carrito y comparativa siguen con «Próximamente» y botón «Descubrir» aunque ya hay precios.
5. Sin favicon, `theme-color` vacío, sin meta description en home ni colecciones, 2 × H1 en la home; sin email/teléfono/redes en ninguna parte; formulario de contacto sin datos.
6. Textos en inglés: «You may also like», «Share». Botón morado «Comprar con Shop».
7. Móvil: cuadrícula de colecciones irregular (paletero vertical vs presurizadores cuadrados); etiquetas de la curva se pisan; «USB-\nC» parte en la comparativa; galería del paletero con foto pequeña.
8. Peso: home ≈ 4,6 MB de imágenes (21, con duplicados, sin tamaños adaptados); vídeo de portada móvil 1,4 MB.
9. Personalización del usuario NO está en el repo: vídeo de fondo en la portada móvil (<750 px), con CSS propio.
10. Sin desbordamiento horizontal en ninguna página.

## No verificado
Modelo 3D cargando (mi entorno bloquea cdn.shopify.com), añadir al carrito, pago, cuenta, hover, teléfono real.
