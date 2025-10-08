import { createChatBotMessage } from 'react-chatbot-kit';
import { 
  WelcomeButtons, 
  AppointmentBooking, 
  DoctorFinder, 
  MedicineRecommendation,
  MedicineSymptoms,
  DeliveryTracking,
  DoctorSearch,
  ViewAppointments,
  HelpOptions,
  DoctorList,
  SymptomSelector,
  OrderTracking
} from './Widgets';
import BotAvatar from './BotAvatar.jsx';

const config = {
  initialMessages: [
    createChatBotMessage("👋 Hello! I'm your Medicare Assistant. How can I help you today?", {
      widget: 'welcomeButtons'
    })
  ],
  widgets: [
    {
      widgetName: 'welcomeButtons',
      widgetFunc: (props) => <WelcomeButtons {...props} />,
    },
    {
      widgetName: 'appointmentBooking',
      widgetFunc: (props) => <AppointmentBooking {...props} />,
    },
    {
      widgetName: 'doctorFinder',
      widgetFunc: (props) => <DoctorFinder {...props} />,
    },
    {
      widgetName: 'symptomSelector',
      widgetFunc: (props) => <SymptomSelector {...props} />,
    },
    {
      widgetName: 'doctorList',
      widgetFunc: (props) => <DoctorList {...props} />,
    },
    {
      widgetName: 'medicineRecommendation',
      widgetFunc: (props) => <MedicineRecommendation {...props} />,
    },
    {
      widgetName: 'medicineSymptoms',
      widgetFunc: (props) => <MedicineSymptoms {...props} />,
    },
          {
            widgetName: 'deliveryTracking',
            widgetFunc: (props) => <DeliveryTracking {...props} />,
          },
          {
            widgetName: 'doctorSearch',
            widgetFunc: (props) => <DoctorSearch {...props} />,
          },
          {
            widgetName: 'viewAppointments',
            widgetFunc: (props) => <ViewAppointments {...props} />,
          },
          {
            widgetName: 'helpOptions',
            widgetFunc: (props) => <HelpOptions {...props} />,
          },
          {
            widgetName: 'orderTracking',
            widgetFunc: (props) => <OrderTracking {...props} />,
          }
        ],
  customStyles: {
    botMessageBox: {
      backgroundColor: '#3873d2ff',
    },
    chatButton: {
      backgroundColor: '#3b82f6',
    },
  },
  customComponents: {
    header: () => null,
    botAvatar: (props) => <BotAvatar {...props} />
  }
};

export default config;
