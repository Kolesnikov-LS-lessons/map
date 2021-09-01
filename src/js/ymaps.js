import renderForm from '../templates/form.hbs';
import renderReviews from '../templates/reviews.hbs';
import renderReviewsAddress from '../templates/reviews_address.hbs';

export function initMap() {
    let allFeeds = (localStorage.feedsData) ? JSON.parse(localStorage.feedsData) : {};
    const balloonHeaderAddress = address => renderReviewsAddress(address);
    const balloonHeader = reviewsArr => renderReviews({ reviewsArr });
    const balloonBody = () => renderForm();

    ymaps.ready(() => {
        let currentCoords = false
        const
            myPoints = {},
            cluster = new ymaps.Clusterer({
                preset: 'islands#redClusterIcons',
                clusterDisableClickZoom: true,
                clusterOpenBalloonOnClick: true,
                clusterBalloonContentLayout: 'cluster#balloonCarousel',
                clusterBalloonItemContentLayout: ymaps.templateLayoutFactory.createClass(
                    '<div class="reviews_carousel" data-id="{{ properties.idForGeoObj }}">' +
                    '{{ properties.myFeeds|raw }}' +
                    '</div>'
                )
            }),
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
            currentCoords = reviews.coords || e.get('coords')
            ymaps.geocode(currentCoords).then(function (res) {
                const firstGeoObject = res.geoObjects.get(0),
                    properties = {
                        contentBody: balloonBody(),
                        contentHeader:
                            reviews.reviewsArr ?
                                balloonHeaderAddress({
                                    line: firstGeoObject.getAddressLine(),
                                    coords: currentCoords.join(',')
                                }) + balloonHeader(reviews.reviewsArr) :
                                false
                    };

                myMap.balloon.open(currentCoords, properties)
            });

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
            ymaps.geocode(coords).then(function (res) {
                const firstGeoObject = res.geoObjects.get(0),
                    myPlaceMark = new ymaps.Placemark(
                        coords,
                        { myFeeds: balloonHeaderAddress({
                            line: firstGeoObject.getAddressLine(),
                            coords: coords
                        }) + balloonHeader(reviewsArr) },
                        { preset: 'islands#redIcon' }
                    )

                myPoints[coords] = myPlaceMark
                cluster.add(myPlaceMark)
                if (reviewsArr.length > 1) {
                    updatePlaceMark(myPlaceMark, reviewsArr.length)
                }
            });

        }

        for (const geo of Object.keys(allFeeds)) {
            addPlaceMark(geo.split(','), allFeeds[geo])
        }

        myMap.geoObjects.events.add('click', e => {
            if (e.get('target').options._name && e.get('target').options._name === 'geoObject') {
                const coords = e.get('target').geometry.getCoordinates();

                openBalloon(myPoints[coords.join(',')], {
                    coords: coords,
                    reviewsArr: allFeeds[coords.join(',')]
                })
            }
        });

        document.addEventListener('click', e => {
            if (e.target.tagName === 'H4' && e.target.parentNode.classList.contains('reviews_carousel')) {
                const clickCoords = e.target.getAttribute('data-coords');

                myMap.balloon.close();
                openBalloon(myPoints[clickCoords], {
                    coords: clickCoords.split(','),
                    reviewsArr: allFeeds[clickCoords]
                })
            }
        })

    })
}