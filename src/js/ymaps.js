import renderForm from '../templates/form.hbs';
import renderReviews from '../templates/reviews.hbs';

export function initMap() {
    let allFeeds = (localStorage.feedsData) ? JSON.parse(localStorage.feedsData) : {};
    const balloonHeader = reviewsArr => renderReviews({ reviewsArr });
    const balloonBody = () => renderForm();

    ymaps.ready(() => {
        let currentCoords = false
        const
            myPoints = {},
            cluster = new ymaps.Clusterer(),
            myMap = new ymaps.Map('map', {
                center: [52.373057, 4.892557],
                zoom: 12,
                controls: []
            })

        myMap.geoObjects.add(cluster);
        myMap.events.add('click', e => myMap.balloon.isOpen() ? myMap.balloon.close() : openBalloon(e));
        document.addEventListener('submit', e => {
            if (e.target.classList.contains('review_form')) {
                e.preventDefault();
                addNewReview(e.target, currentCoords);
            }
        })

        const openBalloon = (e, reviews = {}) => {
            const properties = {
                contentBody: balloonBody(),
                contentHeader: reviews.reviewsArr ? balloonHeader(reviews.reviewsArr) : false
            };

            currentCoords = reviews.coords || e.get('coords')
            myMap.balloon.open(currentCoords, properties)
        }

        const addNewReview = (form, coords) => {
            const newReview = {
                name: form.elements.form_name.value,
                place: form.elements.form_place.value,
                text: form.elements.review_content.value,
                date: new Date().toLocaleDateString()
            }

            allFeeds[coords] ? allFeeds[coords].push(newReview) : allFeeds[coords] = [newReview]
            myPoints[coords] ?
                updatePlaceMark(myPoints[coords], allFeeds[coords].length) :
                addPlaceMark(coords, allFeeds[coords])
            localStorage.feedsData = JSON.stringify(allFeeds)
            myMap.balloon.close();
        }

        const updatePlaceMark = (placeMark, counter) => {
            placeMark.options.set({ preset: 'islands#redCircleIcon' })
            placeMark.properties.set({ iconContent: counter })
        }

        const addPlaceMark = (coords, reviewsArr) => {
            const myPlaceMark = new ymaps.Placemark(
                coords, { myFeeds: balloonHeader(reviewsArr) }, { preset: 'islands#redIcon' }
            )

            myPlaceMark.events.add('click', e => openBalloon(e, { coords, reviewsArr }))
            myPoints[coords] = myPlaceMark
            cluster.add(myPlaceMark)
            if (reviewsArr.length > 1) {
                updatePlaceMark(myPlaceMark, reviewsArr.length)
            }
        }

        for (const geo of Object.keys(allFeeds)) {
            addPlaceMark(geo.split(','), allFeeds[geo])
        }

    })
}