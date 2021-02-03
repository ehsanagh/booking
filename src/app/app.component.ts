import { Component, AfterViewInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ModalService } from './modal/modal.service';

interface Marker {
  lat: number;
  lng: number;
  draggable: boolean;
  icon?: any;
  data?: any;
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements AfterViewInit {
  public HERE_API_KEY = 'nTOBf4amv-over4gyqf9Ore4WU01Mmp2CS-LcBosl8s';
  public title = 'limeTest';
  public zoom = 12;
  public marker: Marker = {
    lat: 51,
    lng: 8,
    draggable: true
  };
  public hotels: Marker[] = [];
  public bookingForm!: FormGroup;
  public bookingFormSubmitted = false;
  public showSuccess = false;

  constructor(
    private http: HttpClient,
    private modalService: ModalService,
    public formBuilder: FormBuilder
  ) {
    this.createBookingForm();
  }

  async ngAfterViewInit(): Promise<any> {
    const { coords } = await this.getCurrentLocation();
    this.setMarker(coords);
    this.loadHotelsOnMap(coords);
    this.enableSlider();
  }

  /**
   * handle on map click event
   */
  mapClicked($event: any): void { }

  /**
   * fires when user location marker moves on map, take the new location and load and place nearby hotels based on that
   * @param param0
   */
  markerDragEnd({ coords: { lat: latitude, lng: longitude } }: any): void {
    this.loadHotelsOnMap({ latitude, longitude });
  }

  /**
   * get the current position
   */
  getCurrentLocation(): any {
    return new Promise((resolve, reject) => {
      if (navigator.geolocation) {
        return navigator.geolocation.getCurrentPosition((position) => {
          resolve(position);
        });
      } else {
        reject(false);
      }
    });
  }

  /**
   * set marker position
   * @param coords
   */
  setMarker(coords: any): void {
    Object.assign(this.marker, {
      lat: coords.latitude,
      lng: coords.longitude
    });
  }

  /**
   * fetch all hotels and create their markers on map
   * @param coords
   */
  async loadHotelsOnMap(coords: any): Promise<any> {
    const { items: hotels } = await this.getNearbyHotels(coords);
    this.setHotelsLocationMarker(hotels);
  }

  /**
   * get the list of hotels based on the coords
   * @param param0
   */
  async getNearbyHotels({ latitude, longitude }: any): Promise<any> {
    const searchURL = `https://discover.search.hereapi.com/v1/discover?at=${latitude},${longitude}&q=hotel&lang=en-US&apiKey=${this.HERE_API_KEY}`;
    return await this.http.get(searchURL).toPromise();
  }

  /**
   * get an array of hotels from API response and create corresponding markers on the map
   * @param hotels
   */
  setHotelsLocationMarker(hotels: any): void {
    if (hotels.length) {
      this.hotels = [];
      hotels.forEach(({ position, ...data }: any) => {
        this.hotels.push({
          lat: position.lat,
          lng: position.lng,
          draggable: false,
          icon: {
            url: './assets/home-icon.svg',
            scaledSize: {
              width: 32,
              height: 32
            }
          },
          data
        });
      });
    }
  }

  /**
   * initiate slider drag and touch support movement
   */
  enableSlider(): void {
    const slider = document.querySelector('.hotels-list') as HTMLElement;
    let isDown = false;
    let startX = 0;
    let scrollLeft = 0;

    const downEvent = (e: any) => {
      isDown = true;
      const pageX = (e.pageX) ? e.pageX : e.changedTouches[0].pageX;
      startX = pageX - slider.offsetLeft;
      scrollLeft = slider.scrollLeft;
    };
    const leaveEvent = () => { isDown = false; };
    const moveEvent = (e: any) => {
      if (!isDown) { return; }
      e.preventDefault();
      const pageX = (e.pageX) ? e.pageX : e.changedTouches[0].pageX;
      const x = pageX - slider.offsetLeft;
      const walk = (x - startX) * 3;
      slider.scrollLeft = scrollLeft - walk;
    };

    /** web browser support for events of slider */
    slider.addEventListener('mousedown', downEvent);
    slider.addEventListener('mouseleave', leaveEvent);
    slider.addEventListener('mouseup', leaveEvent);
    slider.addEventListener('mousemove', moveEvent);

    /** mobile touch support for events of slider */
    slider.addEventListener('touchstart', downEvent, false);
    slider.addEventListener('touchend', leaveEvent, false);
    slider.addEventListener('touchcancel', leaveEvent, false);
    slider.addEventListener('touchmove', moveEvent, false);

  }

  /**
   * open booking modal, reset the form and previous states to have fresh form
   */
  openModal({ data: { title } }: any): void {
    this.showSuccess = false;
    this.bookingFormSubmitted = false;
    this.bookingForm.reset();
    this.bookingForm?.controls?.hotel.setValue(title);
    this.modalService.open('custom-modal-1');
  }

  /**
   * close modal
   */
  closeModal(id: string): void {
    this.modalService.close(id);
  }

  /**
   * create booking form instance
   */
  createBookingForm(): void {
    this.bookingForm = this.formBuilder.group({
      hotel: [{ value: '', disabled: true }, [Validators.required]],
      name: ['', [Validators.required]],
      lastName: ['', [Validators.required]],
      email: ['', {
        validators: Validators.compose([
          Validators.required,
          Validators.pattern('^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+.[a-zA-Z0-9-.]+$')
        ]), updateOn: 'blur'
      }],
      from: ['', [Validators.required]],
      to: ['', [Validators.required]]
    });
  }

  /**
   * get form controls a ref for validation purpose
   */
  get bf(): any { return this.bookingForm?.controls; }

  /**
   * submit the booking form and show the success message
   */
  submitBookingForm(): void {
    this.bookingFormSubmitted = true;
    if (this.bookingForm.status === 'VALID') {
      this.showSuccess = true;
    }
  }

}
