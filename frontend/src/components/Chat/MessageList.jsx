// frontend/src/components/Chat/MessageList.jsx
import '../../App.css';
import PropTypes from 'prop-types';

const MessageList = ({ messages }) => {
  return (
    <div className="chat-container">
      {messages.map((message, index) => (
        <div key={index} className={`chat-message ${message.type}`}>
          {message.content}
        </div>
      ))}
    </div>
  );
};

MessageList.propTypes = {
  messages: PropTypes.arrayOf(PropTypes.shape({
    type: PropTypes.string.isRequired,
    content: PropTypes.string.isRequired
  })).isRequired
};

MessageList.defaultProps = {
  messages: []
};

export default MessageList;