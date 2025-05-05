# 初始化應用模塊
import logging
import logging.config
from app.config import LOGGING_CONFIG

# 配置日誌
logging.config.dictConfig(LOGGING_CONFIG)
logger = logging.getLogger(__name__)

logger.info("初始化應用...")
