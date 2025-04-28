import { getFirestore, collection, addDoc, getDocs, orderBy, deleteDoc, doc, onSnapshot, Timestamp, query } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
import { getApp } from 'https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js';

document.addEventListener('DOMContentLoaded', () => {
    const nombreInput = document.getElementById('nombre');
    const motivoInput = document.getElementById('motivo');
    const fechaInput = document.getElementById('fecha');
    const agendarBtn = document.getElementById('agendarBtn');
    const listaDramas = document.getElementById('listaDramas');

    // Obtén la instancia de la aplicación Firebase (ya inicializada en index.html)
    const app = getApp();
    // Obtén la instancia de Firestore
    const db = getFirestore(app);
    const dramasCollection = collection(db, 'dramas');

    const renderizarDramas = (dramasData) => {
        console.log("Datos recibidos en renderizarDramas:", dramasData);
        listaDramas.innerHTML = '';
        
        dramasData.forEach(drama => {
            console.log("Elemento 'drama' en renderizarDramas:", drama);
            
            // Validación más robusta
            if (!drama || !drama.id || !drama.nombre || !drama.motivo || !drama.fecha) {
                console.error("Error: Elemento 'drama' inválido en renderizarDramas:", drama);
                return; // Saltar este elemento
            }

            try {
                let fechaLocal;
                
                // Manejar diferentes formatos de fecha
                if (typeof drama.fecha.toDate === 'function') {
                    // Si es un Timestamp de Firestore con método toDate()
                    fechaLocal = drama.fecha.toDate().toLocaleString();
                } else if (drama.fecha.seconds) {
                    // Si es un objeto Timestamp sin el método toDate()
                    fechaLocal = new Date(
                        drama.fecha.seconds * 1000 + 
                        (drama.fecha.nanoseconds || 0) / 1000000
                    ).toLocaleString();
                } else if (drama.fecha instanceof Date) {
                    // Si es un objeto Date directamente
                    fechaLocal = drama.fecha.toLocaleString();
                } else {
                    // Si es una cadena o formato desconocido
                    fechaLocal = new Date(drama.fecha).toLocaleString() || 'Fecha no disponible';
                }

                const listItem = document.createElement('li');
                listItem.innerHTML = `
                    <span><strong>${drama.nombre}:</strong> ${drama.motivo} (${fechaLocal})</span>
                    <button class="eliminar-btn" data-id="${drama.id}">Eliminar</button>
                `;
                listaDramas.appendChild(listItem);
            } catch (error) {
                console.error("Error al procesar el drama:", drama, error);
                // Mostrar el drama incluso si hay error con la fecha
                const listItem = document.createElement('li');
                listItem.innerHTML = `
                    <span><strong>${drama.nombre}:</strong> ${drama.motivo} (Fecha inválida)</span>
                    <button class="eliminar-btn" data-id="${drama.id}">Eliminar</button>
                `;
                listItem.style.color = "red";
                listaDramas.appendChild(listItem);
            }
        });

        const botonesEliminar = document.querySelectorAll('.eliminar-btn');
        botonesEliminar.forEach(boton => {
            boton.addEventListener('click', function() {
                const idDramaAEliminar = this.dataset.id;
                eliminarDrama(idDramaAEliminar);
            });
        });
    };

    const obtenerDramas = () => {
        const q = query(dramasCollection, orderBy('fecha'));
        getDocs(q).then((querySnapshot) => {
            const dramasFirestore = [];
            querySnapshot.forEach((doc) => {
                dramasFirestore.push({ id: doc.id, ...doc.data() });
            });
            console.log("Dramas Firestore (obtenerDramas):", dramasFirestore);
            renderizarDramas(dramasFirestore);
        }).catch((error) => {
            console.error("Error al obtener dramas:", error);
            alert("Error al cargar los dramas. Por favor recarga la página.");
        });
    };

    agendarBtn.addEventListener('click', () => {
        const nombre = nombreInput.value.trim();
        const motivo = motivoInput.value.trim();
        const fecha = fechaInput.value;

        if (nombre && motivo && fecha) {
            // Convertir a Timestamp de Firestore
            const fechaObj = new Date(fecha);
            if (isNaN(fechaObj.getTime())) {
                alert('La fecha ingresada no es válida');
                return;
            }

            addDoc(dramasCollection, {
                nombre,
                motivo,
                fecha: Timestamp.fromDate(fechaObj)
            })
            .then(() => {
                console.log("Drama agendado con éxito!");
                nombreInput.value = '';
                motivoInput.value = '';
                fechaInput.value = '';
            })
            .catch((error) => {
                console.error("Error al agendar el drama: ", error);
                alert("Hubo un error al agendar el drama.");
            });
        } else {
            alert('Por favor, completa todos los campos.');
        }
    });

    const eliminarDrama = (idDrama) => {
        if (!idDrama) {
            console.error("ID de drama no proporcionado para eliminar");
            return;
        }

        deleteDoc(doc(dramasCollection, idDrama))
            .then(() => {
                console.log("Drama eliminado con éxito!");
            })
            .catch((error) => {
                console.error("Error al eliminar el drama: ", error);
                alert("Hubo un error al eliminar el drama.");
            });
    };

    // Configurar el listener en tiempo real
    const unsubscribe = onSnapshot(query(dramasCollection, orderBy('fecha')), 
        (snapshot) => {
            console.log("Snapshot recibido:", snapshot);
            const dramasFirestore = [];
            snapshot.forEach((doc) => {
                console.log("Documento en snapshot:", doc);
                dramasFirestore.push({ id: doc.id, ...doc.data() });
            });
            console.log("Dramas Firestore (onSnapshot) antes de renderizar:", dramasFirestore);
            renderizarDramas(dramasFirestore);
        },
        (error) => {
            console.error("Error en la suscripción en tiempo real:", error);
        });

    // Cargar datos iniciales
    obtenerDramas();

    // Limpiar la suscripción al cerrar la página (opcional)
    window.addEventListener('beforeunload', () => {
        unsubscribe();
    });
});