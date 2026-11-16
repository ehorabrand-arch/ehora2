# Paletero EHORA · modelo 3D corregido

`paletero-ehora-corregido.glb` (0,8 MB, comprimido con Draco) es el modelo hecho en Blender con tres retoques que
no tocan la geometría ni los materiales por nombre (Exterior, Handle, Lining, Trim):

1. **Mapa de relieve de la tela eliminado.** La imagen `fabric_normal` del archivo original era toda negra (0,0,0).
   Un mapa de relieve correcto es azul-lila uniforme; en negro la luz lee la tela torcida y los colores oscuros
   (negro, azul marino, verde) salían grises. El acolchado es geometría real, así que no hace falta.
2. **Brillo de tela (sheen) bajado de 1,0 a 0,35.** Con 1,0 los colores oscuros se veían lavados.
3. **Suelo «Floor_Shadow» quitado de la escena.** Su sombra salía como una mancha rectangular enorme; el visor
   dibuja su propia sombra de contacto.

Si se vuelve a exportar desde Blender, conviene aplicar lo mismo en origen: desconectar el Normal Map de los
materiales Exterior, Handle y Lining (o hornear uno válido, con valor plano 128,128,255) y bajar el Sheen.

Para la tienda: subir en Contenido › Archivos y pegar el enlace en el bloque «EHORA · Ver en 3D».
