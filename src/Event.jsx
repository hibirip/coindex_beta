import { useState, useEffect } from 'react';

// 더미 이벤트 데이터 (실제로는 API에서 가져올 수 있습니다)
const eventData = [
  {
    id: 1,
    title: '신규 회원 가입 이벤트',
    thumbnail: 'https://via.placeholder.com/400x300/3B82F6/FFFFFF?text=신규+가입+이벤트',
    fullImage: 'https://via.placeholder.com/800x600/3B82F6/FFFFFF?text=신규+회원+가입+이벤트+상세+내용',
    description: '신규 회원 가입시 최대 10만원 혜택!',
    period: '2024.01.01 ~ 2024.12.31'
  },
  {
    id: 2,
    title: '거래량 달성 이벤트',
    thumbnail: 'https://via.placeholder.com/400x300/10B981/FFFFFF?text=거래량+이벤트',
    fullImage: 'https://via.placeholder.com/800x600/10B981/FFFFFF?text=거래량+달성+이벤트+상세+내용',
    description: '월 거래량 달성시 수수료 할인 혜택',
    period: '2024.01.01 ~ 2024.12.31'
  },
  {
    id: 3,
    title: '추천인 이벤트',
    thumbnail: 'https://via.placeholder.com/400x300/F59E0B/FFFFFF?text=추천인+이벤트',
    fullImage: 'https://via.placeholder.com/800x600/F59E0B/FFFFFF?text=추천인+이벤트+상세+내용',
    description: '친구 추천시 양쪽 모두 혜택!',
    period: '2024.01.01 ~ 2024.12.31'
  },
  {
    id: 4,
    title: '출석체크 이벤트',
    thumbnail: 'https://via.placeholder.com/400x300/8B5CF6/FFFFFF?text=출석체크',
    fullImage: 'https://via.placeholder.com/800x600/8B5CF6/FFFFFF?text=출석체크+이벤트+상세+내용',
    description: '매일 출석체크하고 포인트 받기!',
    period: '2024.01.01 ~ 2024.12.31'
  },
  {
    id: 5,
    title: 'VIP 등급 이벤트',
    thumbnail: 'https://via.placeholder.com/400x300/EF4444/FFFFFF?text=VIP+등급',
    fullImage: 'https://via.placeholder.com/800x600/EF4444/FFFFFF?text=VIP+등급+이벤트+상세+내용',
    description: 'VIP 등급별 특별 혜택 제공',
    period: '2024.01.01 ~ 2024.12.31'
  },
  {
    id: 6,
    title: '스테이킹 이벤트',
    thumbnail: 'https://via.placeholder.com/400x300/06B6D4/FFFFFF?text=스테이킹',
    fullImage: 'https://via.placeholder.com/800x600/06B6D4/FFFFFF?text=스테이킹+이벤트+상세+내용',
    description: '스테이킹 참여시 추가 리워드!',
    period: '2024.01.01 ~ 2024.12.31'
  },
  {
    id: 7,
    title: 'NFT 에어드랍',
    thumbnail: 'https://via.placeholder.com/400x300/EC4899/FFFFFF?text=NFT+에어드랍',
    fullImage: 'https://via.placeholder.com/800x600/EC4899/FFFFFF?text=NFT+에어드랍+상세+내용',
    description: '한정판 NFT 무료 에어드랍!',
    period: '2024.01.01 ~ 2024.03.31'
  },
  {
    id: 8,
    title: '이벤트 코인 상장',
    thumbnail: 'https://via.placeholder.com/400x300/84CC16/FFFFFF?text=신규+상장',
    fullImage: 'https://via.placeholder.com/800x600/84CC16/FFFFFF?text=신규+코인+상장+이벤트',
    description: '신규 코인 상장 기념 이벤트',
    period: '2024.02.01 ~ 2024.02.29'
  },
  {
    id: 9,
    title: '트레이딩 대회',
    thumbnail: 'https://via.placeholder.com/400x300/F97316/FFFFFF?text=트레이딩+대회',
    fullImage: 'https://via.placeholder.com/800x600/F97316/FFFFFF?text=트레이딩+대회+상세+내용',
    description: '월간 트레이딩 대회 참가자 모집!',
    period: '2024.01.01 ~ 2024.12.31'
  }
];

function Modal({ isOpen, onClose, event }) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen || !event) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* 배경 오버레이 */}
      <div 
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* 모달 컨텐츠 */}
      <div className="relative max-w-4xl w-full max-h-[90vh] overflow-auto">
        <div className="card-modern p-6">
          {/* 닫기 버튼 */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors z-10"
          >
            <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* 이벤트 상세 내용 */}
          <div className="space-y-4">
            <h2 className="text-2xl font-bold gradient-text">{event.title}</h2>
            <p className="text-light-muted dark:text-dark-muted">{event.description}</p>
            <div className="text-sm text-primary-500">
              <span className="font-medium">이벤트 기간:</span> {event.period}
            </div>
            
            {/* 메인 이미지 */}
            <div className="rounded-xl overflow-hidden shadow-lg">
              <img
                src={event.fullImage}
                alt={event.title}
                className="w-full h-auto object-cover"
                onError={(e) => {
                  e.target.src = 'https://via.placeholder.com/800x600/6B7280/FFFFFF?text=이미지+로드+실패';
                }}
              />
            </div>

            {/* 액션 버튼 */}
            <div className="flex gap-3 pt-4">
              <button className="btn-primary flex-1">
                이벤트 참여하기
              </button>
              <button className="btn-secondary">
                자세히 보기
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function EventCard({ event, onClick }) {
  return (
    <div 
      className="card-modern overflow-hidden cursor-pointer group"
      onClick={() => onClick(event)}
    >
      {/* 썸네일 이미지 */}
      <div className="relative overflow-hidden">
        <img
          src={event.thumbnail}
          alt={event.title}
          className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
          onError={(e) => {
            e.target.src = 'https://via.placeholder.com/400x300/6B7280/FFFFFF?text=이미지+로드+실패';
          }}
        />
        {/* 호버 오버레이 */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
          <div className="text-white text-center">
            <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            <p className="text-sm font-medium">자세히 보기</p>
          </div>
        </div>
      </div>

      {/* 카드 내용 */}
      <div className="p-4">
        <h3 className="font-semibold text-light-text dark:text-dark-text mb-2 line-clamp-1">
          {event.title}
        </h3>
        <p className="text-sm text-light-muted dark:text-dark-muted mb-3 line-clamp-2">
          {event.description}
        </p>
        <div className="text-xs text-primary-500">
          {event.period}
        </div>
      </div>
    </div>
  );
}

export default function Event() {
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleEventClick = (event) => {
    setSelectedEvent(event);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedEvent(null);
  };

  return (
    <div className="space-y-6">
      {/* 이벤트 그리드 */}
      <div className="card-modern p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {eventData.map((event) => (
            <EventCard 
              key={event.id} 
              event={event} 
              onClick={handleEventClick}
            />
          ))}
        </div>
      </div>

      {/* 추가 정보 섹션 */}
      <div className="card-modern p-6">
        <div className="text-center">
          <h2 className="text-xl font-bold gradient-text mb-4">이벤트 참여 안내</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
            <div className="p-4 rounded-xl bg-primary-50 dark:bg-primary-900/20">
              <div className="text-2xl mb-2">📝</div>
              <h3 className="font-semibold text-primary-700 dark:text-primary-300 mb-2">참여 방법</h3>
              <p className="text-light-muted dark:text-dark-muted">
                각 이벤트 상세페이지에서 참여 버튼을 클릭하여 간편하게 참여하세요.
              </p>
            </div>
            <div className="p-4 rounded-xl bg-green-50 dark:bg-green-900/20">
              <div className="text-2xl mb-2">🎁</div>
              <h3 className="font-semibold text-green-700 dark:text-green-300 mb-2">혜택 수령</h3>
              <p className="text-light-muted dark:text-dark-muted">
                이벤트 종료 후 3영업일 이내에 혜택이 지급됩니다.
              </p>
            </div>
            <div className="p-4 rounded-xl bg-yellow-50 dark:bg-yellow-900/20">
              <div className="text-2xl mb-2">⚠️</div>
              <h3 className="font-semibold text-yellow-700 dark:text-yellow-300 mb-2">주의 사항</h3>
              <p className="text-light-muted dark:text-dark-muted">
                이벤트 기간 및 조건을 반드시 확인 후 참여해주세요.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 모달 */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={handleCloseModal} 
        event={selectedEvent} 
      />
    </div>
  );
} 